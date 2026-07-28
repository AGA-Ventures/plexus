"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { isActiveAdminRecoveryAccount } from "@/lib/admin-password-recovery"
import { getAuthenticatedIdentity } from "@/lib/authorization"
import type { Locale } from "@/lib/i18n"
import { retryAutomaticMeetingCreation } from "@/lib/meeting-automation"
import {
  getPasswordRecoveryRedirectUrl,
  resolvePasswordRecoveryOrigin,
} from "@/lib/password-recovery"
import { type TenantStatus, type VendorStatus } from "@/lib/management-data"
import { hasMatchingPasswordConfirmation } from "@/lib/password-confirmation"
import { isPlaceholderIndustrySector } from "@/lib/industry-sectors"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { buildVendorDirectoryUpdate } from "@/lib/vendor-directory"

export type ManagementActionResult = {
  ok: boolean
  error?: string
}

const uuidSchema = z.uuid()
const localeSchema = z.enum(["en", "zh", "zh-Hant", "th"])
const tenantStatusSchema = z.enum(["active", "suspended", "archived"])
const vendorStatusSchema = z.enum(["active", "suspended", "archived"])
const vendorTypeSchema = z.enum(["delegation", "partner"])
const industrySectorSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .refine(
    (value) => !isPlaceholderIndustrySector(value),
    "Select an industry sector."
  )

const createAdminSchema = z
  .object({
    locale: localeSchema,
    tenantName: z.string().trim().min(2).max(120),
    tenantSlug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    supportEmail: z.email().trim(),
    displayName: z.string().trim().min(2).max(120),
    email: z.email().trim(),
    temporaryPassword: z.string().min(12).max(128),
    confirmTemporaryPassword: z.string().min(12).max(128),
  })
  .refine(
    (value) =>
      hasMatchingPasswordConfirmation(
        value.temporaryPassword,
        value.confirmTemporaryPassword
      ),
    {
      message: "Temporary passwords do not match.",
      path: ["confirmTemporaryPassword"],
    }
  )

const createVendorSchema = z.object({
  locale: localeSchema,
  adminId: uuidSchema,
  vendorType: vendorTypeSchema,
  companyName: z.string().trim().min(2).max(180),
  companyNameCn: z.string().trim().max(180).default(""),
  sector: industrySectorSchema,
  displayName: z.string().trim().min(2).max(120),
  email: z.email().trim(),
  temporaryPassword: z.string().min(12).max(128),
})

const updateTenantSchema = z.object({
  locale: localeSchema,
  tenantId: uuidSchema,
  name: z.string().trim().min(2).max(120),
  supportEmail: z.email().trim(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, "Enter a six-digit hex color."),
  logoUrl: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) =>
        value === "" || value.startsWith("/") || value.startsWith("https://"),
      "Use an HTTPS URL or a public path beginning with /."
    ),
})

const updateVendorSchema = z
  .object({
    locale: localeSchema,
    vendorId: uuidSchema,
    vendorType: vendorTypeSchema,
    nameEn: z.string().trim().min(2).max(180),
    nameCn: z.string().trim().max(180),
    sector: industrySectorSchema,
    companySize: z.string().trim().min(1).max(120),
    contactName: z.string().trim().max(160),
    contactDetails: z.string().trim().max(240),
    origin: z.string().trim().max(120),
    partnerType: z.enum(["Government", "Association", "Enterprise"]),
    description: z.string().trim().max(4_000),
    coordinator: z.string().trim().max(120),
    accountId: uuidSchema.nullable(),
    accountDisplayName: z.string().trim().max(120),
    accountEmail: z.union([z.literal(""), z.email().trim()]),
  })
  .superRefine((value, context) => {
    if (!value.accountId) return

    if (value.accountDisplayName.length < 2) {
      context.addIssue({
        code: "custom",
        message: "Enter the account holder's name.",
        path: ["accountDisplayName"],
      })
    }

    if (!value.accountEmail) {
      context.addIssue({
        code: "custom",
        message: "Enter a valid login email.",
        path: ["accountEmail"],
      })
    }
  })

const updatePlatformSettingSchema = z.object({
  locale: localeSchema,
  settingId: uuidSchema,
  value: z.string().trim().max(20_000),
})
const retryMeetingCreationSchema = z.object({
  locale: localeSchema,
  jobId: uuidSchema,
})

function actionError(error: unknown) {
  return {
    ok: false,
    error:
      error instanceof Error
        ? error.message
        : "The management action could not be completed.",
  } satisfies ManagementActionResult
}

function refreshManagement(locale: Locale) {
  revalidatePath(`/${locale}/superadmin`)
  revalidatePath(`/${locale}/admin`)
}

async function requireOperator() {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    throw new Error(authorization.error)
  }

  if (!["superadmin", "admin"].includes(authorization.identity.role)) {
    throw new Error("Superadmin or Admin access is required.")
  }

  return authorization
}

export async function createAdminAccountAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = createAdminSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const authorization = await requireOperator()

    if (authorization.identity.role !== "superadmin") {
      return { ok: false, error: "Only Superadmins can create Admins." }
    }

    const adminClient = createSupabaseAdminClient()
    const tenantResult = await authorization.supabase
      .from("admin_tenants")
      .insert({
        slug: parsed.data.tenantSlug,
        name: parsed.data.tenantName,
        support_email: parsed.data.supportEmail,
      })
      .select("id")
      .single()

    if (tenantResult.error) {
      return { ok: false, error: tenantResult.error.message }
    }

    const tenantId = tenantResult.data.id
    const authResult = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.temporaryPassword,
      email_confirm: true,
      app_metadata: {
        role: "admin",
        admin_id: tenantId,
      },
      user_metadata: {
        display_name: parsed.data.displayName,
      },
    })

    if (authResult.error || !authResult.data.user) {
      await authorization.supabase
        .from("admin_tenants")
        .delete()
        .eq("id", tenantId)
      return {
        ok: false,
        error: authResult.error?.message ?? "Auth user creation failed.",
      }
    }

    const profileResult = await authorization.supabase
      .from("user_profiles")
      .insert({
        id: authResult.data.user.id,
        role: "admin",
        display_name: parsed.data.displayName,
        email: parsed.data.email,
        admin_id: tenantId,
        active: true,
      })

    if (profileResult.error) {
      await adminClient.auth.admin.deleteUser(authResult.data.user.id)
      await authorization.supabase
        .from("admin_tenants")
        .delete()
        .eq("id", tenantId)
      return { ok: false, error: profileResult.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function createVendorAccountAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = createVendorSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const authorization = await requireOperator()
    const { identity, supabase } = authorization

    if (identity.role === "admin" && identity.adminId !== parsed.data.adminId) {
      return {
        ok: false,
        error: "Admins can create Vendors only in their own tenant.",
      }
    }

    if (identity.role === "admin") {
      const permissionResult = await supabase
        .from("platform_settings")
        .select("value")
        .eq("setting_key", "vendor_account_provisioning")
        .maybeSingle()

      if (permissionResult.error || permissionResult.data?.value !== true) {
        return {
          ok: false,
          error: "Vendor account provisioning is disabled by Plexus.",
        }
      }
    }

    const tenantResult = await supabase
      .from("admin_tenants")
      .select("id")
      .eq("id", parsed.data.adminId)
      .eq("status", "active")
      .maybeSingle()

    if (tenantResult.error || !tenantResult.data) {
      return { ok: false, error: "Select an active Admin tenant." }
    }

    const adminClient = createSupabaseAdminClient()
    const vendorId = crypto.randomUUID()
    const authResult = await adminClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.temporaryPassword,
      email_confirm: true,
      app_metadata: {
        role: "vendor",
        admin_id: parsed.data.adminId,
        vendor_company_id: vendorId,
        vendor_type: parsed.data.vendorType,
      },
      user_metadata: {
        display_name: parsed.data.displayName,
      },
    })

    if (authResult.error || !authResult.data.user) {
      return {
        ok: false,
        error: authResult.error?.message ?? "Auth user creation failed.",
      }
    }

    const commonCompany = {
      id: vendorId,
      admin_id: parsed.data.adminId,
      vendor_company_id: vendorId,
      vendor_type: parsed.data.vendorType,
      name_en: parsed.data.companyName,
      name_cn: parsed.data.companyNameCn,
      sector: parsed.data.sector,
      company_size: "Pending",
      contact: parsed.data.email,
      contact_meta: "Provisioned Vendor account",
      profile_complete: 0,
    }

    const companyResult =
      parsed.data.vendorType === "delegation"
        ? await supabase.from("delegation_companies").insert({
            ...commonCompany,
            origin: "Pending",
            needs: "",
            status: "Invited",
            urgent: false,
            coordinator: parsed.data.displayName,
          })
        : await supabase.from("partner_companies").insert({
            ...commonCompany,
            partner_type: "Enterprise",
            offerings: "",
            status: "Invited",
            verified: "Pending",
            attendance: "Invited",
            arrived: false,
          })

    if (companyResult.error) {
      await adminClient.auth.admin.deleteUser(authResult.data.user.id)
      return { ok: false, error: companyResult.error.message }
    }

    const profileResult = await supabase.from("user_profiles").insert({
      id: authResult.data.user.id,
      role: "vendor",
      display_name: parsed.data.displayName,
      email: parsed.data.email,
      admin_id: parsed.data.adminId,
      vendor_company_id: vendorId,
      vendor_type: parsed.data.vendorType,
      active: true,
    })

    if (profileResult.error) {
      const table =
        parsed.data.vendorType === "delegation"
          ? "delegation_companies"
          : "partner_companies"
      await supabase.from(table).delete().eq("id", vendorId)
      await adminClient.auth.admin.deleteUser(authResult.data.user.id)
      return { ok: false, error: profileResult.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function setTenantStatusAction(input: {
  locale: Locale
  tenantId: string
  status: TenantStatus
}): Promise<ManagementActionResult> {
  const parsed = z
    .object({
      locale: localeSchema,
      tenantId: uuidSchema,
      status: tenantStatusSchema,
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid tenant status request." }
  }

  try {
    const authorization = await requireOperator()

    if (authorization.identity.role !== "superadmin") {
      return { ok: false, error: "Only Superadmins can change Admin status." }
    }

    const result = await authorization.supabase
      .from("admin_tenants")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.tenantId)
      .select("id")
      .single()

    if (result.error) {
      return { ok: false, error: result.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function sendAdminPasswordResetAction(input: {
  locale: Locale
  userId: string
}): Promise<ManagementActionResult> {
  const parsed = z
    .object({
      locale: localeSchema,
      userId: uuidSchema,
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid Admin password-recovery request." }
  }

  try {
    const authorization = await requireOperator()

    if (authorization.identity.role !== "superadmin") {
      return {
        ok: false,
        error: "Only Superadmins can send Admin recovery links.",
      }
    }

    const profileResult = await authorization.supabase
      .from("user_profiles")
      .select("id, email, role, admin_id, active")
      .eq("id", parsed.data.userId)
      .maybeSingle()

    const profile = profileResult.data

    if (profileResult.error || !isActiveAdminRecoveryAccount(profile)) {
      return {
        ok: false,
        error: "Select an active Admin account in your permitted scope.",
      }
    }

    const tenantResult = await authorization.supabase
      .from("admin_tenants")
      .select("id, slug")
      .eq("id", profile.admin_id)
      .maybeSingle()

    if (tenantResult.error || !tenantResult.data) {
      return {
        ok: false,
        error: "The Admin tenant could not be verified.",
      }
    }

    const adminClient = createSupabaseAdminClient()
    const auditResult = await adminClient.from("audit_events").insert({
      actor_user_id: authorization.identity.userId,
      actor_role: authorization.identity.role,
      action: "request_password_recovery",
      target_table: "user_profiles",
      target_id: profile.id,
      admin_id: profile.admin_id,
      before_values: null,
      after_values: {
        delivery: "email_link",
        tenant_slug: tenantResult.data.slug,
      },
    })

    if (auditResult.error) {
      return {
        ok: false,
        error:
          "The recovery request could not be audited, so no email was sent.",
      }
    }

    const origin = resolvePasswordRecoveryOrigin({
      productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    })
    const redirectTo = getPasswordRecoveryRedirectUrl({
      origin,
      locale: parsed.data.locale,
      tenantSlug: tenantResult.data.slug,
    })
    const supabase = await createSupabaseServerClient()
    const resetResult = await supabase.auth.resetPasswordForEmail(
      profile.email,
      { redirectTo }
    )

    if (resetResult.error) {
      console.warn("Supabase Admin password recovery request failed.", {
        code: resetResult.error.code,
        status: resetResult.error.status,
      })
      return {
        ok: false,
        error:
          "The recovery email could not be sent. Check the Auth email service and try again.",
      }
    }

    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function updateTenantProfileAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = updateTenantSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const authorization = await requireOperator()

    if (
      authorization.identity.role === "admin" &&
      authorization.identity.adminId !== parsed.data.tenantId
    ) {
      return { ok: false, error: "Admins can edit only their own tenant." }
    }

    const result = await authorization.supabase
      .from("admin_tenants")
      .update({
        name: parsed.data.name,
        support_email: parsed.data.supportEmail,
        primary_color: parsed.data.primaryColor,
        logo_url: parsed.data.logoUrl,
      })
      .eq("id", parsed.data.tenantId)
      .select("id")
      .single()

    if (result.error) {
      return { ok: false, error: result.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function setVendorStatusAction(input: {
  locale: Locale
  vendorId: string
  status: VendorStatus
}): Promise<ManagementActionResult> {
  const parsed = z
    .object({
      locale: localeSchema,
      vendorId: uuidSchema,
      status: vendorStatusSchema,
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid Vendor status request." }
  }

  try {
    const authorization = await requireOperator()
    const result = await authorization.supabase
      .from("vendor_companies")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.vendorId)
      .select("id")
      .single()

    if (result.error) {
      return { ok: false, error: result.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function updateVendorDirectoryAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = updateVendorSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const authorization = await requireOperator()
    const { supabase } = authorization
    const table =
      parsed.data.vendorType === "delegation"
        ? "delegation_companies"
        : "partner_companies"

    const existingVendorResult = await supabase
      .from(table)
      .select("*")
      .eq("vendor_company_id", parsed.data.vendorId)
      .maybeSingle()

    if (existingVendorResult.error || !existingVendorResult.data) {
      return { ok: false, error: "Vendor is outside your permitted scope." }
    }

    const existingVendor = existingVendorResult.data
    const previousCompanyValues = buildVendorDirectoryUpdate({
      vendorType: parsed.data.vendorType,
      nameEn: existingVendor.name_en,
      nameCn: existingVendor.name_cn,
      sector: existingVendor.sector,
      companySize: existingVendor.company_size,
      contactName: existingVendor.contact,
      contactDetails: existingVendor.contact_meta,
      origin:
        parsed.data.vendorType === "delegation" ? existingVendor.origin : "",
      partnerType:
        parsed.data.vendorType === "partner"
          ? existingVendor.partner_type
          : "Enterprise",
      description:
        parsed.data.vendorType === "delegation"
          ? existingVendor.needs
          : existingVendor.offerings,
      coordinator:
        parsed.data.vendorType === "delegation"
          ? existingVendor.coordinator
          : "",
    })

    let existingAccount:
      | {
          id: string
          display_name: string
          email: string
        }
      | undefined
    let existingAuthMetadata: Record<string, unknown> = {}

    if (parsed.data.accountId) {
      const accountResult = await supabase
        .from("user_profiles")
        .select(
          "id, display_name, email, role, admin_id, vendor_company_id, vendor_type"
        )
        .eq("id", parsed.data.accountId)
        .eq("vendor_company_id", parsed.data.vendorId)
        .maybeSingle()

      if (
        accountResult.error ||
        !accountResult.data ||
        accountResult.data.role !== "vendor" ||
        accountResult.data.vendor_type !== parsed.data.vendorType ||
        accountResult.data.admin_id !== existingVendor.admin_id
      ) {
        return {
          ok: false,
          error: "The selected login account is outside this Vendor.",
        }
      }

      existingAccount = accountResult.data
      const adminClient = createSupabaseAdminClient()
      const authUserResult = await adminClient.auth.admin.getUserById(
        parsed.data.accountId
      )

      if (authUserResult.error || !authUserResult.data.user) {
        return {
          ok: false,
          error: "The selected login account could not be verified.",
        }
      }

      existingAuthMetadata = authUserResult.data.user.user_metadata ?? {}
    }

    const companyResult = await supabase
      .from(table)
      .update(buildVendorDirectoryUpdate(parsed.data))
      .eq("vendor_company_id", parsed.data.vendorId)
      .select("id")
      .single()

    if (companyResult.error) {
      return { ok: false, error: companyResult.error.message }
    }

    if (parsed.data.accountId && existingAccount) {
      const restoreCompany = () =>
        supabase
          .from(table)
          .update(previousCompanyValues)
          .eq("vendor_company_id", parsed.data.vendorId)

      const profileResult = await supabase
        .from("user_profiles")
        .update({
          display_name: parsed.data.accountDisplayName,
          email: parsed.data.accountEmail,
        })
        .eq("id", parsed.data.accountId)

      if (profileResult.error) {
        const companyRollback = await restoreCompany()
        return {
          ok: false,
          error: companyRollback.error
            ? "The account update failed and the company profile could not be fully restored. Contact a Superadmin."
            : "The account update failed. The original company details were restored.",
        }
      }

      const adminClient = createSupabaseAdminClient()
      const authResult = await adminClient.auth.admin.updateUserById(
        parsed.data.accountId,
        {
          email: parsed.data.accountEmail,
          user_metadata: {
            ...existingAuthMetadata,
            display_name: parsed.data.accountDisplayName,
          },
        }
      )

      if (authResult.error) {
        const [profileRollback, companyRollback] = await Promise.all([
          supabase
            .from("user_profiles")
            .update({
              display_name: existingAccount.display_name,
              email: existingAccount.email,
            })
            .eq("id", existingAccount.id),
          restoreCompany(),
        ])

        return {
          ok: false,
          error:
            profileRollback.error || companyRollback.error
              ? "The login change failed and the original profile could not be fully restored. Contact a Superadmin."
              : "The login change was rejected. The original Vendor details were restored.",
        }
      }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function setAccountActiveAction(input: {
  locale: Locale
  userId: string
  active: boolean
}): Promise<ManagementActionResult> {
  const parsed = z
    .object({
      locale: localeSchema,
      userId: uuidSchema,
      active: z.boolean(),
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid account status request." }
  }

  try {
    const authorization = await requireOperator()

    if (authorization.identity.userId === parsed.data.userId) {
      return {
        ok: false,
        error: "Use a different Superadmin account to suspend yourself.",
      }
    }

    const profileResult = await authorization.supabase
      .from("user_profiles")
      .select("id, role")
      .eq("id", parsed.data.userId)
      .maybeSingle()

    if (profileResult.error || !profileResult.data) {
      return { ok: false, error: "Account is outside your permitted scope." }
    }

    if (
      authorization.identity.role === "admin" &&
      profileResult.data.role !== "vendor"
    ) {
      return { ok: false, error: "Admins can manage only Vendor accounts." }
    }

    const adminClient = createSupabaseAdminClient()
    const updateResult = await authorization.supabase
      .from("user_profiles")
      .update({ active: parsed.data.active })
      .eq("id", parsed.data.userId)

    if (updateResult.error) {
      return { ok: false, error: updateResult.error.message }
    }

    const authResult = await adminClient.auth.admin.updateUserById(
      parsed.data.userId,
      {
        ban_duration: parsed.data.active ? "none" : "876000h",
      }
    )

    if (authResult.error) {
      await authorization.supabase
        .from("user_profiles")
        .update({ active: !parsed.data.active })
        .eq("id", parsed.data.userId)
      return { ok: false, error: authResult.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function syncAccountClaimsAction(input: {
  locale: Locale
  userId: string
}): Promise<ManagementActionResult> {
  const parsed = z
    .object({
      locale: localeSchema,
      userId: uuidSchema,
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid account claim request." }
  }

  try {
    const authorization = await requireOperator()
    const profileResult = await authorization.supabase
      .from("user_profiles")
      .select("id, role, admin_id, vendor_company_id, vendor_type")
      .eq("id", parsed.data.userId)
      .maybeSingle()

    if (profileResult.error || !profileResult.data) {
      return { ok: false, error: "Account is outside your permitted scope." }
    }

    if (
      authorization.identity.role === "admin" &&
      profileResult.data.role !== "vendor"
    ) {
      return {
        ok: false,
        error: "Admins can synchronize only Vendor accounts.",
      }
    }

    const profile = profileResult.data
    const appMetadata =
      profile.role === "superadmin"
        ? { role: "superadmin" }
        : profile.role === "admin"
          ? {
              role: "admin",
              admin_id: profile.admin_id,
            }
          : {
              role: "vendor",
              admin_id: profile.admin_id,
              vendor_company_id: profile.vendor_company_id,
              vendor_type: profile.vendor_type,
            }
    const adminClient = createSupabaseAdminClient()
    const existingUser = await adminClient.auth.admin.getUserById(
      parsed.data.userId
    )

    if (existingUser.error || !existingUser.data.user) {
      return {
        ok: false,
        error: existingUser.error?.message ?? "Auth user does not exist.",
      }
    }

    const updateResult = await adminClient.auth.admin.updateUserById(
      parsed.data.userId,
      { app_metadata: appMetadata }
    )

    if (updateResult.error) {
      return { ok: false, error: updateResult.error.message }
    }

    const auditResult = await adminClient.from("audit_events").insert({
      actor_user_id: authorization.identity.userId,
      actor_role: authorization.identity.role,
      action: "sync_auth_claims",
      target_table: "auth.users",
      target_id: parsed.data.userId,
      admin_id: profile.admin_id,
      before_values: {
        app_metadata: existingUser.data.user.app_metadata,
      },
      after_values: {
        app_metadata: appMetadata,
      },
    })

    if (auditResult.error) {
      await adminClient.auth.admin.updateUserById(parsed.data.userId, {
        app_metadata: existingUser.data.user.app_metadata,
      })
      return {
        ok: false,
        error: `Audit logging failed, so the claim change was reverted: ${auditResult.error.message}`,
      }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function transferVendorAction(input: {
  locale: Locale
  vendorId: string
  destinationAdminId: string
}): Promise<ManagementActionResult> {
  const parsed = z
    .object({
      locale: localeSchema,
      vendorId: uuidSchema,
      destinationAdminId: uuidSchema,
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid Vendor transfer request." }
  }

  try {
    const authorization = await requireOperator()

    if (authorization.identity.role !== "superadmin") {
      return { ok: false, error: "Only Superadmins can transfer Vendors." }
    }

    const [vendorResult, destinationResult, profilesResult] = await Promise.all(
      [
        authorization.supabase
          .from("vendor_companies")
          .select("admin_id, vendor_type")
          .eq("id", parsed.data.vendorId)
          .single(),
        authorization.supabase
          .from("admin_tenants")
          .select("id")
          .eq("id", parsed.data.destinationAdminId)
          .eq("status", "active")
          .maybeSingle(),
        authorization.supabase
          .from("user_profiles")
          .select("id")
          .eq("vendor_company_id", parsed.data.vendorId)
          .eq("role", "vendor"),
      ]
    )

    if (vendorResult.error) {
      return { ok: false, error: vendorResult.error.message }
    }
    if (destinationResult.error || !destinationResult.data) {
      return { ok: false, error: "Select an active destination Admin." }
    }
    if (vendorResult.data.admin_id === parsed.data.destinationAdminId) {
      return { ok: true }
    }

    const adminClient = createSupabaseAdminClient()
    const profileIds = (profilesResult.data ?? []).map((profile) => profile.id)
    const previousAdminId = vendorResult.data.admin_id

    for (const userId of profileIds) {
      const authUpdate = await adminClient.auth.admin.updateUserById(userId, {
        app_metadata: {
          role: "vendor",
          admin_id: parsed.data.destinationAdminId,
          vendor_company_id: parsed.data.vendorId,
          vendor_type: vendorResult.data.vendor_type,
        },
      })

      if (authUpdate.error) {
        for (const changedUserId of profileIds) {
          await adminClient.auth.admin.updateUserById(changedUserId, {
            app_metadata: {
              role: "vendor",
              admin_id: previousAdminId,
              vendor_company_id: parsed.data.vendorId,
              vendor_type: vendorResult.data.vendor_type,
            },
          })
        }
        return { ok: false, error: authUpdate.error.message }
      }
    }

    const transferResult = await authorization.supabase.rpc("transfer_vendor", {
      p_vendor_id: parsed.data.vendorId,
      p_destination_admin_id: parsed.data.destinationAdminId,
    })

    if (transferResult.error) {
      for (const userId of profileIds) {
        await adminClient.auth.admin.updateUserById(userId, {
          app_metadata: {
            role: "vendor",
            admin_id: previousAdminId,
            vendor_company_id: parsed.data.vendorId,
            vendor_type: vendorResult.data.vendor_type,
          },
        })
      }
      return { ok: false, error: transferResult.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function updatePlatformSettingAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = updatePlatformSettingSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const authorization = await requireOperator()

    if (authorization.identity.role !== "superadmin") {
      return {
        ok: false,
        error: "Only Superadmins can change platform settings.",
      }
    }

    let value: unknown
    try {
      value = JSON.parse(parsed.data.value)
    } catch {
      value = parsed.data.value
    }

    const result = await authorization.supabase
      .from("platform_settings")
      .update({
        value,
        updated_by: authorization.identity.userId,
      })
      .eq("id", parsed.data.settingId)
      .select("id")
      .single()

    if (result.error) {
      return { ok: false, error: result.error.message }
    }

    refreshManagement(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function retryMeetingCreationAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = retryMeetingCreationSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Choose a valid meeting creation incident." }
  }

  try {
    const authorization = await requireOperator()

    if (authorization.identity.role !== "superadmin") {
      return {
        ok: false,
        error: "Only Superadmins can retry critical meeting incidents.",
      }
    }

    const state = await retryAutomaticMeetingCreation({
      jobId: parsed.data.jobId,
      actor: {
        userId: authorization.identity.userId,
        role: authorization.identity.role,
      },
    })

    refreshManagement(parsed.data.locale)

    if (state === "failed") {
      return {
        ok: false,
        error:
          "The provider retry failed. The incident remains critical for Superadmin review.",
      }
    }

    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

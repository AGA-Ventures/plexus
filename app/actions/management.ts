"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { isActiveAdminRecoveryAccount } from "@/lib/admin-password-recovery"
import { getAuthenticatedIdentity } from "@/lib/authorization"
import { buildApprovedCompanyInsert } from "@/lib/company-profile-persistence"
import {
  getTenantEmailRecipients,
  renderPlexusEmail,
  sendTrackedEmail,
  sendTrackedEmails,
  sendTrackedSupabaseAuthEmail,
} from "@/lib/email-delivery-service"
import type { Locale } from "@/lib/i18n"
import type { CompanyRegistrationProfile } from "@/lib/local-db"
import { retryAutomaticMeetingCreation } from "@/lib/meeting-automation"
import {
  getPasswordRecoveryRedirectUrl,
  resolvePasswordRecoveryOrigin,
} from "@/lib/password-recovery"
import { type TenantStatus, type VendorStatus } from "@/lib/management-data"
import { hasMatchingPasswordConfirmation } from "@/lib/password-confirmation"
import { isPlaceholderIndustrySector } from "@/lib/industry-sectors"
import {
  meetingTimeOptions,
  normalizeMeetingAvailability,
} from "@/lib/meeting-availability"
import {
  createSupabaseAdminClient,
  hasSupabaseAdminSecret,
} from "@/lib/supabase/admin"
import { vendorApplicationProfileSchema } from "@/lib/vendor-applications"
import { buildVendorDirectoryUpdate } from "@/lib/vendor-directory"

export type ManagementActionResult = {
  ok: boolean
  error?: string
  warning?: string
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

const updateTenantVendorDiscoverySchema = z.object({
  locale: localeSchema,
  enabled: z.boolean(),
})
const meetingTimeSchema = z.enum(meetingTimeOptions)
const updateTenantMeetingAvailabilitySchema = z.object({
  locale: localeSchema,
  availability: z
    .object({
      "1": z.array(meetingTimeSchema).max(meetingTimeOptions.length),
      "2": z.array(meetingTimeSchema).max(meetingTimeOptions.length),
      "3": z.array(meetingTimeSchema).max(meetingTimeOptions.length),
      "4": z.array(meetingTimeSchema).max(meetingTimeOptions.length),
      "5": z.array(meetingTimeSchema).max(meetingTimeOptions.length),
    })
    .strict(),
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
const vendorApplicationActionSchema = z.object({
  locale: localeSchema,
  applicationId: uuidSchema,
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

async function sendVendorSetupEmail({
  locale,
  tenantSlug,
  email,
  recipientName,
  recipientRole,
  adminId,
  actor,
  trigger,
  source,
}: {
  locale: Locale
  tenantSlug: string
  email: string
  recipientName: string
  recipientRole: "admin" | "vendor"
  adminId: string
  actor: {
    type: "superadmin" | "admin"
    userId: string
    name: string
  }
  trigger: "vendor_setup" | "vendor_setup_resend" | "account_setup"
  source: {
    table: string
    id: string
  }
}) {
  const origin = resolvePasswordRecoveryOrigin({
    productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })
  const redirectTo = getPasswordRecoveryRedirectUrl({
    origin,
    locale,
    tenantSlug,
    mode: "setup",
  })
  return sendTrackedSupabaseAuthEmail({
    adminId,
    actor,
    recipient: {
      email,
      name: recipientName,
      role: recipientRole,
    },
    trigger,
    subject:
      recipientRole === "admin"
        ? "Set up your Plexus Admin password"
        : "Set up your Plexus Vendor password",
    redirectTo,
    source,
  })
}

async function resetClaimedVendorApplication(
  applicationId: string,
  adminClient: ReturnType<typeof createSupabaseAdminClient>
) {
  const result = await adminClient
    .from("vendor_applications")
    .update({
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      vendor_company_id: null,
      auth_user_id: null,
    })
    .eq("id", applicationId)
    .eq("status", "provisioning")

  return !result.error
}

async function removeProvisionedVendor({
  adminClient,
  vendorId,
  vendorType,
  authUserId,
}: {
  adminClient: ReturnType<typeof createSupabaseAdminClient>
  vendorId: string
  vendorType: "delegation" | "partner"
  authUserId?: string
}) {
  const cleanupErrors: string[] = []

  if (authUserId) {
    const profileResult = await adminClient
      .from("user_profiles")
      .delete()
      .eq("id", authUserId)

    if (profileResult.error) cleanupErrors.push("account profile")
  }

  const table =
    vendorType === "delegation" ? "delegation_companies" : "partner_companies"

  const subtypeResult = await adminClient
    .from(table)
    .delete()
    .eq("id", vendorId)

  if (subtypeResult.error) cleanupErrors.push("Vendor subtype")

  const vendorResult = await adminClient
    .from("vendor_companies")
    .delete()
    .eq("id", vendorId)

  if (vendorResult.error) cleanupErrors.push("canonical Vendor")

  if (authUserId) {
    const authResult = await adminClient.auth.admin.deleteUser(authUserId)

    if (authResult.error) cleanupErrors.push("Auth user")
  }

  return cleanupErrors
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

    const setupResult = await sendVendorSetupEmail({
      locale: parsed.data.locale,
      tenantSlug: parsed.data.tenantSlug,
      email: parsed.data.email,
      recipientName: parsed.data.displayName,
      recipientRole: "admin",
      adminId: tenantId,
      actor: {
        type: "superadmin",
        userId: authorization.identity.userId,
        name: authorization.identity.displayName,
      },
      trigger: "account_setup",
      source: {
        table: "user_profiles",
        id: authResult.data.user.id,
      },
    })

    refreshManagement(parsed.data.locale)
    return setupResult.ok
      ? { ok: true }
      : {
          ok: true,
          warning:
            "The Admin account was created, but its secure setup email could not be requested.",
        }
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
      .select("id, slug")
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

    const setupResult = await sendVendorSetupEmail({
      locale: parsed.data.locale,
      tenantSlug: tenantResult.data.slug,
      email: parsed.data.email,
      recipientName: parsed.data.displayName,
      recipientRole: "vendor",
      adminId: parsed.data.adminId,
      actor: {
        type: identity.role === "superadmin" ? "superadmin" : "admin",
        userId: identity.userId,
        name: identity.displayName,
      },
      trigger: "account_setup",
      source: {
        table: "user_profiles",
        id: authResult.data.user.id,
      },
    })

    refreshManagement(parsed.data.locale)
    return setupResult.ok
      ? { ok: true }
      : {
          ok: true,
          warning:
            "The Vendor account was created, but its secure setup email could not be requested.",
        }
  } catch (error) {
    return actionError(error)
  }
}

export async function approveVendorApplicationAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = vendorApplicationActionSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid Vendor application approval." }
  }

  try {
    const authorization = await requireOperator()
    const { identity, supabase } = authorization

    if (identity.role !== "admin" || !identity.adminId) {
      return {
        ok: false,
        error: "Only the owning Admin can approve this application.",
      }
    }

    if (!hasSupabaseAdminSecret()) {
      return {
        ok: false,
        error: "Trusted Auth administration is not configured.",
      }
    }

    const [permissionResult, tenantResult, applicationResult] =
      await Promise.all([
        supabase
          .from("platform_settings")
          .select("value")
          .eq("setting_key", "vendor_account_provisioning")
          .maybeSingle(),
        supabase
          .from("admin_tenants")
          .select("id, slug")
          .eq("id", identity.adminId)
          .eq("status", "active")
          .maybeSingle(),
        supabase
          .from("vendor_applications")
          .select("*")
          .eq("id", parsed.data.applicationId)
          .maybeSingle(),
      ])

    if (permissionResult.error || permissionResult.data?.value !== true) {
      return {
        ok: false,
        error: "Vendor account provisioning is disabled by Plexus.",
      }
    }

    if (tenantResult.error || !tenantResult.data) {
      return { ok: false, error: "The Admin tenant is not active." }
    }

    const application = applicationResult.data

    if (
      applicationResult.error ||
      !application ||
      application.admin_id !== identity.adminId
    ) {
      return {
        ok: false,
        error: "The Vendor application is outside your tenant.",
      }
    }

    if (application.status !== "pending") {
      return {
        ok: false,
        error: "This Vendor application is no longer pending.",
      }
    }

    const profileResult = vendorApplicationProfileSchema.safeParse(
      application.profile_data
    )

    if (!profileResult.success) {
      return {
        ok: false,
        error:
          "The submitted company profile no longer passes the required validation.",
      }
    }

    const reviewedAt = new Date().toISOString()
    const adminClient = createSupabaseAdminClient()
    const claimResult = await adminClient
      .from("vendor_applications")
      .update({
        status: "provisioning",
        reviewed_by: identity.userId,
        reviewed_at: reviewedAt,
      })
      .eq("id", application.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle()

    if (claimResult.error || !claimResult.data) {
      return {
        ok: false,
        error:
          "Another review has already claimed this application. Refresh and try again.",
      }
    }

    const vendorId = crypto.randomUUID()
    let authUserId: string | undefined

    try {
      const authResult = await adminClient.auth.admin.createUser({
        email: application.normalized_email,
        email_confirm: true,
        app_metadata: {
          role: "vendor",
          admin_id: identity.adminId,
          vendor_company_id: vendorId,
          vendor_type: application.vendor_type,
        },
        user_metadata: {
          display_name: application.contact_name,
        },
      })

      if (authResult.error || !authResult.data.user) {
        throw new Error(
          authResult.error?.message ?? "Auth user creation failed."
        )
      }

      authUserId = authResult.data.user.id
      const companyInsert = buildApprovedCompanyInsert({
        adminId: identity.adminId,
        vendorId,
        vendorType: application.vendor_type,
        profile: profileResult.data as CompanyRegistrationProfile,
      })
      const companyResult =
        companyInsert.table === "delegation_companies"
          ? await supabase
              .from("delegation_companies")
              .insert(companyInsert.values as never)
          : await supabase
              .from("partner_companies")
              .insert(companyInsert.values as never)

      if (companyResult.error) {
        throw new Error(companyResult.error.message)
      }

      const accountResult = await supabase.from("user_profiles").insert({
        id: authUserId,
        role: "vendor",
        display_name: application.contact_name,
        email: application.normalized_email,
        admin_id: identity.adminId,
        vendor_company_id: vendorId,
        vendor_type: application.vendor_type,
        active: true,
      })

      if (accountResult.error) {
        throw new Error(accountResult.error.message)
      }

      const approvalResult = await adminClient.rpc(
        "finalize_vendor_application_approval",
        {
          p_application_id: application.id,
          p_admin_id: identity.adminId,
          p_actor_user_id: identity.userId,
          p_vendor_company_id: vendorId,
          p_auth_user_id: authUserId,
        }
      )

      if (approvalResult.error || approvalResult.data !== true) {
        throw new Error(
          approvalResult.error?.message ??
            "The application approval could not be finalized."
        )
      }
    } catch (error) {
      const cleanupErrors = await removeProvisionedVendor({
        adminClient,
        vendorId,
        vendorType: application.vendor_type,
        authUserId,
      })

      if (cleanupErrors.length) {
        return {
          ok: false,
          error:
            "Provisioning failed and automatic cleanup needs operator review. The application remains locked to prevent duplicate accounts.",
        }
      }

      const claimReset = await resetClaimedVendorApplication(
        application.id,
        adminClient
      )

      if (!claimReset) {
        return {
          ok: false,
          error:
            "Provisioning failed. Created records were removed, but the application claim needs operator review.",
        }
      }

      return actionError(error)
    }

    const setupResult = await sendVendorSetupEmail({
      locale: parsed.data.locale,
      tenantSlug: tenantResult.data.slug,
      email: application.normalized_email,
      recipientName: application.contact_name,
      recipientRole: "vendor",
      adminId: identity.adminId,
      actor: {
        type: "admin",
        userId: identity.userId,
        name: identity.displayName,
      },
      trigger: "vendor_setup",
      source: {
        table: "vendor_applications",
        id: application.id,
      },
    })

    if (!setupResult.ok) {
      console.warn("Vendor setup email delivery failed.")
      refreshManagement(parsed.data.locale)
      return {
        ok: true,
        warning:
          "The Vendor account was approved, but the setup email could not be sent. Use Resend setup email.",
      }
    }

    const emailTimestampResult = await adminClient
      .from("vendor_applications")
      .update({ setup_email_sent_at: new Date().toISOString() })
      .eq("id", application.id)
      .eq("status", "approved")

    refreshManagement(parsed.data.locale)

    if (emailTimestampResult.error) {
      return {
        ok: true,
        warning:
          "The setup email was sent, but its delivery timestamp could not be recorded.",
      }
    }

    return { ok: true }
  } catch (error) {
    return actionError(error)
  }
}

export async function rejectVendorApplicationAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = vendorApplicationActionSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid Vendor application rejection." }
  }

  try {
    const authorization = await requireOperator()
    const { identity, supabase } = authorization

    if (identity.role !== "admin" || !identity.adminId) {
      return {
        ok: false,
        error: "Only the owning Admin can reject this application.",
      }
    }

    const applicationResult = await supabase
      .from("vendor_applications")
      .select(
        "id, admin_id, status, vendor_type, normalized_email, contact_name, company_name"
      )
      .eq("id", parsed.data.applicationId)
      .maybeSingle()
    const application = applicationResult.data

    if (
      applicationResult.error ||
      !application ||
      application.admin_id !== identity.adminId
    ) {
      return {
        ok: false,
        error: "The Vendor application is outside your tenant.",
      }
    }

    if (!hasSupabaseAdminSecret()) {
      return {
        ok: false,
        error: "Trusted application review is not configured.",
      }
    }

    const adminClient = createSupabaseAdminClient()
    const result = await adminClient.rpc("reject_vendor_application", {
      p_application_id: application.id,
      p_admin_id: identity.adminId,
      p_actor_user_id: identity.userId,
    })

    if (result.error || result.data !== true) {
      return {
        ok: false,
        error: "This Vendor application is no longer pending.",
      }
    }

    const subject = "Update on your Vendor application"
    const text = `Your application for ${application.company_name} was not approved. If you need clarification or want to submit updated information, please contact the workspace support team.`
    const emailResult = await sendTrackedEmail({
      adminId: identity.adminId,
      actor: {
        type: "admin",
        userId: identity.userId,
        name: identity.displayName,
      },
      recipient: {
        email: application.normalized_email,
        name: application.contact_name,
        role: "external",
      },
      trigger: "vendor_application_rejected",
      subject,
      text,
      html: renderPlexusEmail({
        title: subject,
        message: text,
      }),
      source: {
        table: "vendor_applications",
        id: application.id,
      },
    })

    refreshManagement(parsed.data.locale)
    return emailResult.ok
      ? { ok: true }
      : {
          ok: true,
          warning:
            "The application was rejected, but the decision email could not be sent.",
        }
  } catch (error) {
    return actionError(error)
  }
}

export async function resendVendorSetupEmailAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = vendorApplicationActionSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Invalid setup-email request." }
  }

  try {
    const authorization = await requireOperator()
    const { identity, supabase } = authorization

    if (identity.role !== "admin" || !identity.adminId) {
      return {
        ok: false,
        error: "Only the owning Admin can resend this setup email.",
      }
    }

    const [tenantResult, applicationResult] = await Promise.all([
      supabase
        .from("admin_tenants")
        .select("slug")
        .eq("id", identity.adminId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("vendor_applications")
        .select("id, admin_id, status, normalized_email, contact_name")
        .eq("id", parsed.data.applicationId)
        .maybeSingle(),
    ])
    const application = applicationResult.data

    if (
      tenantResult.error ||
      !tenantResult.data ||
      applicationResult.error ||
      !application ||
      application.admin_id !== identity.adminId ||
      application.status !== "approved"
    ) {
      return {
        ok: false,
        error: "Select an approved application in your active tenant.",
      }
    }

    const setupResult = await sendVendorSetupEmail({
      locale: parsed.data.locale,
      tenantSlug: tenantResult.data.slug,
      email: application.normalized_email,
      recipientName: application.contact_name,
      recipientRole: "vendor",
      adminId: identity.adminId,
      actor: {
        type: "admin",
        userId: identity.userId,
        name: identity.displayName,
      },
      trigger: "vendor_setup_resend",
      source: {
        table: "vendor_applications",
        id: application.id,
      },
    })

    if (!setupResult.ok) {
      console.warn("Vendor setup email resend failed.")
      return {
        ok: false,
        error:
          "The setup email could not be sent. Check the Auth email service and try again.",
      }
    }

    const sentAt = new Date().toISOString()
    const adminClient = createSupabaseAdminClient()
    const updateResult = await adminClient
      .from("vendor_applications")
      .update({ setup_email_sent_at: sentAt })
      .eq("id", application.id)
      .eq("status", "approved")

    if (updateResult.error) {
      return {
        ok: true,
        warning:
          "The setup email was sent, but its delivery timestamp could not be recorded.",
      }
    }

    await adminClient.from("audit_events").insert({
      actor_user_id: identity.userId,
      actor_role: identity.role,
      action: "resend_vendor_setup_email",
      target_table: "vendor_applications",
      target_id: application.id,
      admin_id: identity.adminId,
      after_values: { setup_email_sent_at: sentAt },
    })

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

    const recipients = await getTenantEmailRecipients({
      adminId: parsed.data.tenantId,
      target: "admin",
    })
    const subject = `Your Plexus workspace is ${parsed.data.status}`
    const text = `A Plexus Superadmin changed your workspace status to ${parsed.data.status}. Contact Plexus support if you need help with access or next steps.`
    const emailResults = await sendTrackedEmails(
      recipients.map((recipient) => ({
        adminId: parsed.data.tenantId,
        actor: {
          type: "superadmin" as const,
          userId: authorization.identity.userId,
          name: authorization.identity.displayName,
        },
        recipient,
        trigger: "account_status_changed" as const,
        subject,
        text,
        html: renderPlexusEmail({
          title: subject,
          message: text,
        }),
        source: {
          table: "admin_tenants",
          id: parsed.data.tenantId,
        },
      }))
    )

    refreshManagement(parsed.data.locale)
    return emailResults.some((email) => !email.ok)
      ? {
          ok: true,
          warning:
            "The workspace status changed, but one or more Admin emails failed.",
        }
      : { ok: true }
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
    const resetResult = await sendTrackedSupabaseAuthEmail({
      adminId: profile.admin_id,
      actor: {
        type: "superadmin",
        userId: authorization.identity.userId,
        name: authorization.identity.displayName,
      },
      recipient: {
        email: profile.email,
        role: "admin",
      },
      trigger: "admin_recovery",
      subject: "Reset your Plexus Admin password",
      redirectTo,
      source: {
        table: "user_profiles",
        id: profile.id,
      },
    })

    if (!resetResult.ok) {
      console.warn("Supabase Admin password recovery request failed.")
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

export async function updateTenantVendorDiscoveryAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = updateTenantVendorDiscoverySchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const authorization = await requireOperator()

    if (
      authorization.identity.role !== "admin" ||
      !authorization.identity.adminId
    ) {
      return {
        ok: false,
        error: "Only the owning Admin can change Vendor discovery.",
      }
    }

    const result = await authorization.supabase
      .from("admin_tenants")
      .update({
        vendor_discovery_enabled: parsed.data.enabled,
      })
      .eq("id", authorization.identity.adminId)
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

export async function updateTenantMeetingAvailabilityAction(
  input: unknown
): Promise<ManagementActionResult> {
  const parsed = updateTenantMeetingAvailabilitySchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const authorization = await requireOperator()

    if (
      authorization.identity.role !== "admin" ||
      !authorization.identity.adminId
    ) {
      return {
        ok: false,
        error: "Only the owning Admin can change meeting availability.",
      }
    }

    const availability = normalizeMeetingAvailability(parsed.data.availability)
    const result = await authorization.supabase
      .from("admin_tenants")
      .update({
        meeting_availability: availability,
      })
      .eq("id", authorization.identity.adminId)
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
      .select("id, admin_id, name_en")
      .single()

    if (result.error) {
      return { ok: false, error: result.error.message }
    }

    const profilesResult = await createSupabaseAdminClient()
      .from("user_profiles")
      .select("email, display_name, role")
      .eq("vendor_company_id", parsed.data.vendorId)
      .eq("role", "vendor")
    const subject = `${result.data.name_en} is ${parsed.data.status}`
    const text = `Your Vendor company status in Plexus was changed to ${parsed.data.status}. Contact your workspace Admin if you need help with access or next steps.`
    const emailResults = profilesResult.error
      ? []
      : await sendTrackedEmails(
          (profilesResult.data ?? []).map((profile) => ({
            adminId: result.data.admin_id,
            actor: {
              type:
                authorization.identity.role === "superadmin"
                  ? ("superadmin" as const)
                  : ("admin" as const),
              userId: authorization.identity.userId,
              name: authorization.identity.displayName,
            },
            recipient: {
              email: profile.email,
              name: profile.display_name,
              role: "vendor" as const,
            },
            trigger: "account_status_changed" as const,
            subject,
            text,
            html: renderPlexusEmail({
              title: subject,
              message: text,
            }),
            source: {
              table: "vendor_companies",
              id: parsed.data.vendorId,
            },
          }))
        )

    refreshManagement(parsed.data.locale)
    return profilesResult.error || emailResults.some((email) => !email.ok)
      ? {
          ok: true,
          warning:
            "The Vendor status changed, but one or more account emails failed.",
        }
      : { ok: true }
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

    let emailWarning: string | undefined

    if (
      parsed.data.accountId &&
      existingAccount &&
      existingAccount.email.toLowerCase() !==
        parsed.data.accountEmail.toLowerCase()
    ) {
      const subject = "Your Plexus login email was changed"
      const source = {
        table: "user_profiles",
        id: existingAccount.id,
      }
      const results = await sendTrackedEmails([
        {
          adminId: existingVendor.admin_id,
          actor: {
            type:
              authorization.identity.role === "superadmin"
                ? "superadmin"
                : "admin",
            userId: authorization.identity.userId,
            name: authorization.identity.displayName,
          },
          recipient: {
            email: existingAccount.email,
            name: existingAccount.display_name,
            role: "vendor",
          },
          trigger: "login_email_changed",
          subject,
          text: `The Plexus login email for this account was changed from ${existingAccount.email} to ${parsed.data.accountEmail}. If you did not expect this, contact your workspace support team immediately.`,
          source,
        },
        {
          adminId: existingVendor.admin_id,
          actor: {
            type:
              authorization.identity.role === "superadmin"
                ? "superadmin"
                : "admin",
            userId: authorization.identity.userId,
            name: authorization.identity.displayName,
          },
          recipient: {
            email: parsed.data.accountEmail,
            name: parsed.data.accountDisplayName,
            role: "vendor",
          },
          trigger: "login_email_changed",
          subject,
          text: `This address is now the login email for your Plexus Vendor account. If you did not expect this, contact your workspace support team immediately.`,
          source,
        },
      ])

      if (results.some((email) => !email.ok)) {
        emailWarning =
          "The Vendor details were updated, but one or both email-change notices failed."
      }
    }

    refreshManagement(parsed.data.locale)
    return emailWarning ? { ok: true, warning: emailWarning } : { ok: true }
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
      .select("id, role, display_name, email, admin_id")
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

    const profile = profileResult.data
    const subject = parsed.data.active
      ? "Your Plexus account was reactivated"
      : "Your Plexus account was suspended"
    const text = parsed.data.active
      ? "Your Plexus account access has been restored. You can sign in again using your current login email."
      : "Your Plexus account access has been suspended. Contact your workspace support team if you need help or believe this was unexpected."
    const emailResult = await sendTrackedEmail({
      adminId: profile.admin_id ?? undefined,
      actor: {
        type:
          authorization.identity.role === "superadmin" ? "superadmin" : "admin",
        userId: authorization.identity.userId,
        name: authorization.identity.displayName,
      },
      recipient: {
        email: profile.email,
        name: profile.display_name,
        role: profile.role,
      },
      trigger: "account_status_changed",
      subject,
      text,
      html: renderPlexusEmail({
        title: subject,
        message: text,
      }),
      source: {
        table: "user_profiles",
        id: profile.id,
      },
    })

    refreshManagement(parsed.data.locale)
    return emailResult.ok
      ? { ok: true }
      : {
          ok: true,
          warning: "The account status changed, but its email notice failed.",
        }
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
          .select("admin_id, vendor_type, name_en")
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
          .select("id, email, display_name, role")
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

    const [previousAdmins, destinationAdmins] = await Promise.all([
      getTenantEmailRecipients({
        adminId: previousAdminId,
        target: "admin",
      }),
      getTenantEmailRecipients({
        adminId: parsed.data.destinationAdminId,
        target: "admin",
      }),
    ])
    const recipients = new Map<
      string,
      {
        email: string
        name: string
        role: "admin" | "vendor"
      }
    >()

    for (const profile of profilesResult.data ?? []) {
      recipients.set(profile.email.toLowerCase(), {
        email: profile.email,
        name: profile.display_name,
        role: "vendor",
      })
    }
    for (const admin of [...previousAdmins, ...destinationAdmins]) {
      recipients.set(admin.email.toLowerCase(), {
        email: admin.email,
        name: admin.name,
        role: "admin",
      })
    }

    const subject = `${vendorResult.data.name_en} was transferred`
    const text =
      "Plexus transferred this Vendor company to a different Admin workspace. Vendor access and Admin responsibility now follow the destination workspace."
    const emailResults = await sendTrackedEmails(
      [...recipients.values()].map((recipient) => ({
        adminId: parsed.data.destinationAdminId,
        actor: {
          type: "superadmin" as const,
          userId: authorization.identity.userId,
          name: authorization.identity.displayName,
        },
        recipient,
        trigger: "vendor_transferred" as const,
        subject,
        text,
        html: renderPlexusEmail({
          title: subject,
          message: text,
        }),
        source: {
          table: "vendor_companies",
          id: parsed.data.vendorId,
        },
      }))
    )

    refreshManagement(parsed.data.locale)
    return emailResults.some((email) => !email.ok)
      ? {
          ok: true,
          warning:
            "The Vendor was transferred, but one or more transfer emails failed.",
        }
      : { ok: true }
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

"use server"

import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import {
  getAppMetadata,
  getRoleBindingError,
  getRolePortalPath,
} from "@/lib/auth"
import {
  getLoginProviderErrorCode,
  getLoginValidationErrorCode,
  type LoginErrorCode,
} from "@/lib/login-errors"
import {
  getAuthenticatedIdentity,
  validateAuthenticatedUser,
} from "@/lib/authorization"
import {
  recordTrackedSupabaseAuthEmail,
  renderPlexusEmail,
  resolveTrackedRecipient,
  sendTrackedEmail,
} from "@/lib/email-delivery-service"
import { normalizeLocale, type Locale } from "@/lib/i18n"
import {
  getLoginPath,
  getPasswordRecoveryRedirectUrl,
  resolvePasswordRecoveryOrigin,
} from "@/lib/password-recovery"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type LoginActionState = {
  errorCode?: LoginErrorCode
  redirectTo?: string
}

export type PasswordRecoveryActionState = {
  error?: string
  sent?: boolean
}

export type UpdatePasswordActionState = {
  error?: string
  redirectTo?: string
}

export type UpdateOwnProfileActionResult = {
  ok: boolean
  displayName?: string
  error?: string
}

const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Enter your password."),
  locale: z.string().optional(),
  tenantSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
})

const passwordRecoveryRequestSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  locale: z.string().optional(),
  tenantSlug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
})

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(128, "Use no more than 128 characters."),
    confirmPassword: z.string(),
    locale: z.string().optional(),
    tenantSlug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    mode: z.enum(["recovery", "setup"]).default("recovery"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

const updateOwnProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  locale: z.enum(["en", "zh", "zh-Hant", "th"]),
})

export async function loginAction(
  _state: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
    tenantSlug: formData.get("tenantSlug") || undefined,
  })

  if (!parsed.success) {
    return {
      errorCode: getLoginValidationErrorCode(parsed.error.issues[0]?.path[0]),
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { errorCode: getLoginProviderErrorCode(error.message) }
  }

  const metadata = getAppMetadata(data.user)
  const bindingError = getRoleBindingError(metadata)

  if (bindingError) {
    await supabase.auth.signOut()
    return { errorCode: "account_access_unavailable" }
  }

  const authorization = await validateAuthenticatedUser(supabase, data.user)

  if (!authorization.ok) {
    await supabase.auth.signOut()
    return { errorCode: "account_access_unavailable" }
  }

  if (parsed.data.tenantSlug) {
    const adminId = authorization.identity.adminId
    const tenantResult = adminId
      ? await supabase
          .from("admin_tenants")
          .select("slug")
          .eq("id", adminId)
          .eq("status", "active")
          .maybeSingle()
      : undefined

    if (
      !tenantResult?.data ||
      tenantResult.error ||
      tenantResult.data.slug !== parsed.data.tenantSlug
    ) {
      await supabase.auth.signOut()
      return {
        errorCode: "wrong_workspace",
      }
    }
  }

  return {
    redirectTo: getRolePortalPath(
      normalizeLocale(parsed.data.locale) as Locale,
      authorization.identity.role
    ),
  }
}

export async function requestPasswordResetAction(
  _state: PasswordRecoveryActionState,
  formData: FormData
): Promise<PasswordRecoveryActionState> {
  const parsed = passwordRecoveryRequestSchema.safeParse({
    email: formData.get("email"),
    locale: formData.get("locale"),
    tenantSlug: formData.get("tenantSlug") || undefined,
  })

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the email address.",
    }
  }

  const locale = normalizeLocale(parsed.data.locale)
  const origin = resolvePasswordRecoveryOrigin({
    productionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })
  const redirectTo = getPasswordRecoveryRedirectUrl({
    origin,
    locale,
    tenantSlug: parsed.data.tenantSlug,
  })

  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo }
    )
    const trackedRecipient = await resolveTrackedRecipient(parsed.data.email)

    if (error) {
      console.warn("Supabase password recovery request failed.", {
        code: error.code,
        status: error.status,
      })
    }

    if (trackedRecipient) {
      await recordTrackedSupabaseAuthEmail(
        {
          adminId: trackedRecipient.adminId,
          actor: {
            type: "supabase_auth",
            name: "Supabase Auth",
          },
          recipient: trackedRecipient.recipient,
          trigger: "password_reset",
          subject: "Reset your Plexus password",
          redirectTo,
          source: {
            table: "user_profiles",
            id: trackedRecipient.id,
          },
        },
        { errorCode: error?.code }
      )
    }
  } catch {
    console.warn("Supabase password recovery request failed.")
  }

  // Always return the same response for valid email syntax so the public form
  // cannot be used to discover registered accounts.
  return { sent: true }
}

export async function updatePasswordAction(
  _state: UpdatePasswordActionState,
  formData: FormData
): Promise<UpdatePasswordActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    locale: formData.get("locale"),
    tenantSlug: formData.get("tenantSlug") || undefined,
    mode: formData.get("mode") || undefined,
  })

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ?? "Check the new password details.",
    }
  }

  const supabase = await createSupabaseServerClient()
  const userResult = await supabase.auth.getUser()

  if (userResult.error || !userResult.data.user) {
    return {
      error:
        "This recovery link is invalid or has expired. Request a new link.",
    }
  }

  const updateResult = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (updateResult.error) {
    return {
      error:
        "We could not update your password. Request a new recovery link and try again.",
    }
  }

  const user = userResult.data.user
  const metadata = getAppMetadata(user)

  if (user.email && metadata.role) {
    after(async () => {
      const subject = "Your Plexus password was changed"
      const text =
        "Your Plexus password was changed successfully. If you did not make this change, contact your workspace support team immediately and request account suspension."

      await sendTrackedEmail({
        adminId: metadata.admin_id,
        actor: {
          type: "plexus_system",
          name: "Plexus security",
        },
        recipient: {
          email: user.email!,
          name:
            typeof user.user_metadata?.display_name === "string"
              ? user.user_metadata.display_name
              : "",
          role: metadata.role!,
        },
        trigger: "password_changed",
        subject,
        text,
        html: renderPlexusEmail({
          title: subject,
          message: text,
        }),
        source: {
          table: "user_profiles",
          id: user.id,
        },
      })
    })
  }

  await supabase.auth.signOut()

  return {
    redirectTo: getLoginPath(
      normalizeLocale(parsed.data.locale),
      parsed.data.tenantSlug,
      true
    ),
  }
}

export async function updateOwnProfileAction(
  input: unknown
): Promise<UpdateOwnProfileActionResult> {
  const parsed = updateOwnProfileSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Enter a name between 2 and 120 characters.",
    }
  }

  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return { ok: false, error: authorization.error }
  }

  try {
    // The service client is intentionally server-only. The authenticated user
    // ID is resolved from the verified session and only display_name is
    // accepted, so role, tenant, status, and email bindings cannot be changed.
    const adminClient = createSupabaseAdminClient()
    const result = await adminClient
      .from("user_profiles")
      .update({ display_name: parsed.data.displayName })
      .eq("id", authorization.identity.userId)
      .select("display_name")
      .single()

    if (result.error) {
      return { ok: false, error: result.error.message }
    }

    revalidatePath(
      getRolePortalPath(parsed.data.locale, authorization.identity.role)
    )

    return {
      ok: true,
      displayName: result.data.display_name,
    }
  } catch {
    return {
      ok: false,
      error: "Your profile could not be updated. Try again.",
    }
  }
}

export async function logoutAction(locale: Locale) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  return { redirectTo: `/${locale}/login` }
}

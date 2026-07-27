"use server"

import { z } from "zod"

import {
  getAppMetadata,
  getRoleBindingError,
  getRolePortalPath,
} from "@/lib/auth"
import { validateAuthenticatedUser } from "@/lib/authorization"
import { normalizeLocale, type Locale } from "@/lib/i18n"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type LoginActionState = {
  error?: string
  redirectTo?: string
}

function formatLoginError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes("invalid login credentials")) {
    return "Email or password is incorrect. Check your details and try again."
  }

  if (normalized.includes("email not confirmed")) {
    return "This account is not ready to sign in. Contact your workspace administrator."
  }

  return "We could not sign you in. Check your details and try again."
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
      error: parsed.error.issues[0]?.message ?? "Check your login details.",
    }
  }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: formatLoginError(error.message) }
  }

  const metadata = getAppMetadata(data.user)
  const bindingError = getRoleBindingError(metadata)

  if (bindingError) {
    await supabase.auth.signOut()
    return { error: bindingError }
  }

  const authorization = await validateAuthenticatedUser(supabase, data.user)

  if (!authorization.ok) {
    await supabase.auth.signOut()
    return { error: authorization.error }
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
        error:
          "This account does not belong to this workspace. Use your organization’s sign-in page.",
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

export async function logoutAction(locale: Locale) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  return { redirectTo: `/${locale}/login` }
}

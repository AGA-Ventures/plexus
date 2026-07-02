"use server"

import { z } from "zod"

import { getAppMetadata, getRolePortalPath } from "@/lib/auth"
import { normalizeLocale, type Locale } from "@/lib/i18n"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type LoginActionState = {
  error?: string
  redirectTo?: string
}

function formatLoginError(message: string) {
  const normalized = message.toLowerCase()

  if (normalized.includes("invalid login credentials")) {
    return "Invalid login credentials. Check the email and password, or ask an admin to confirm this account exists in Supabase Auth."
  }

  if (normalized.includes("email not confirmed")) {
    return "Email is not confirmed. Ask an admin to confirm the user in Supabase Auth, then try again."
  }

  return message
}

const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(1, "Enter your password."),
  locale: z.string().optional(),
})

export async function loginAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your login details." }
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

  if (!metadata.role) {
    await supabase.auth.signOut()
    return {
      error:
        "This account can sign in, but it has no launch role. Ask an admin to set app_metadata.role to admin, delegation, or partner.",
    }
  }

  return {
    redirectTo: getRolePortalPath(normalizeLocale(parsed.data.locale) as Locale, metadata.role),
  }
}

export async function logoutAction(locale: Locale) {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()

  return { redirectTo: `/${locale}/login` }
}

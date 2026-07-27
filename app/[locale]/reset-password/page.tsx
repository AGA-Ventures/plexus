import { notFound } from "next/navigation"

import { UpdatePasswordForm } from "@/components/password-recovery-form"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getLoginBranding } from "@/lib/login-branding"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tenant?: string | string[] }>
}) {
  const { locale } = await params
  const { tenant } = await searchParams

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const requestedTenant = Array.isArray(tenant) ? tenant[0] : tenant
  const [branding, userResult] = await Promise.all([
    getLoginBranding(requestedTenant),
    createSupabaseServerClient().then((supabase) => supabase.auth.getUser()),
  ])

  return (
    <UpdatePasswordForm
      locale={normalizedLocale}
      branding={branding}
      recoveryReady={!userResult.error && Boolean(userResult.data.user)}
    />
  )
}

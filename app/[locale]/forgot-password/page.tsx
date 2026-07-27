import { notFound } from "next/navigation"

import { ForgotPasswordForm } from "@/components/password-recovery-form"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getLoginBranding } from "@/lib/login-branding"

export default async function ForgotPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    error?: string | string[]
    tenant?: string | string[]
  }>
}) {
  const { locale } = await params
  const { error, tenant } = await searchParams

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const branding = await getLoginBranding(
    Array.isArray(tenant) ? tenant[0] : tenant
  )

  return (
    <ForgotPasswordForm
      locale={normalizedLocale}
      branding={branding}
      invalidLink={(Array.isArray(error) ? error[0] : error) === "invalid-link"}
    />
  )
}

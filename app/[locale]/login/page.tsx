import { notFound } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { getLoginBranding } from "@/lib/login-branding"
import { getLoginRedirect } from "@/lib/plexus-data"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"

export default async function LocaleLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    passwordUpdated?: string | string[]
    tenant?: string | string[]
  }>
}) {
  const { locale } = await params
  const { passwordUpdated, tenant } = await searchParams

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  await getLoginRedirect(normalizedLocale)
  const branding = await getLoginBranding(
    Array.isArray(tenant) ? tenant[0] : tenant
  )

  return (
    <LoginForm
      locale={normalizedLocale}
      branding={branding}
      passwordUpdated={
        (Array.isArray(passwordUpdated)
          ? passwordUpdated[0]
          : passwordUpdated) === "1"
      }
    />
  )
}

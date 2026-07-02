import { notFound } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { getLoginRedirect } from "@/lib/plexus-data"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"

export default async function LocaleLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  await getLoginRedirect(normalizedLocale)

  return <LoginForm locale={normalizedLocale} />
}

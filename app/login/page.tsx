import { redirect } from "next/navigation"

import { getLoginPath } from "@/lib/password-recovery"
import { normalizeLocale } from "@/lib/i18n"
import { normalizePublicLocale } from "@/lib/public-site"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string | string[]
    tenant?: string | string[]
    passwordUpdated?: string | string[]
  }>
}) {
  const { lang, tenant, passwordUpdated } = await searchParams
  const locale = normalizeLocale(
    normalizePublicLocale(Array.isArray(lang) ? lang[0] : lang)
  )
  const tenantSlug = Array.isArray(tenant) ? tenant[0] : tenant
  const updated = Array.isArray(passwordUpdated)
    ? passwordUpdated[0]
    : passwordUpdated

  redirect(getLoginPath(locale, tenantSlug, updated === "1"))
}

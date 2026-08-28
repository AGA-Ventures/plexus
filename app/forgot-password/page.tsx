import { redirect } from "next/navigation"

import { getForgotPasswordPath } from "@/lib/password-recovery"
import { normalizeLocale } from "@/lib/i18n"
import { normalizePublicLocale } from "@/lib/public-site"

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string | string[]
    tenant?: string | string[]
  }>
}) {
  const { lang, tenant } = await searchParams
  redirect(
    getForgotPasswordPath(
      normalizeLocale(
        normalizePublicLocale(Array.isArray(lang) ? lang[0] : lang)
      ),
      Array.isArray(tenant) ? tenant[0] : tenant
    )
  )
}

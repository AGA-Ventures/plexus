import { redirect } from "next/navigation"

import { getResetPasswordPath } from "@/lib/password-recovery"
import { normalizePublicLocale } from "@/lib/public-site"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    lang?: string | string[]
    tenant?: string | string[]
    mode?: string | string[]
  }>
}) {
  const { lang, tenant, mode } = await searchParams
  const requestedMode = Array.isArray(mode) ? mode[0] : mode
  redirect(
    getResetPasswordPath(
      normalizePublicLocale(Array.isArray(lang) ? lang[0] : lang),
      Array.isArray(tenant) ? tenant[0] : tenant,
      requestedMode === "setup" ? "setup" : "recovery"
    )
  )
}

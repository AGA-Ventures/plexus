import { notFound, redirect } from "next/navigation"

import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"

export default async function DelegationLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  await getProtectedPortalData(normalizedLocale, "vendor")

  redirect(`/${normalizedLocale}/vendor`)
}

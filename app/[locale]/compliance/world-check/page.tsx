import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComplianceConsole } from "@/components/compliance-console"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"

export const metadata: Metadata = {
  title: "Compliance · Plexus",
  description: "Protected Compliance workspace.",
}

export default async function WorldCheckPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const { session } = await getProtectedPortalData(normalizedLocale, [
    "superadmin",
    "admin",
  ])

  return <ComplianceConsole locale={normalizedLocale} session={session} />
}

import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComplianceConsole } from "@/components/compliance-console"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"

export const metadata: Metadata = {
  title: "World-Check AML Screening · Plexus Connect",
  description: "Admin route for World-Check AML screening readiness.",
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
  await getProtectedPortalData(normalizedLocale, "admin")

  return <ComplianceConsole locale={normalizedLocale} view="world-check" />
}

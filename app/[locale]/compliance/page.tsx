import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComplianceConsole } from "@/components/compliance-console"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"

export const metadata: Metadata = {
  title: "Compliance Integrations · Plexus Connect",
  description:
    "Admin readiness routes for World-Check, Malaysia SSM and CTOS checks.",
}

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  await getProtectedPortalData(normalizedLocale, ["superadmin", "admin"])

  return <ComplianceConsole locale={normalizedLocale} view="overview" />
}

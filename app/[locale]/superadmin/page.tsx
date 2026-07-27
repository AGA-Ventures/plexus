import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SuperadminConsole } from "@/components/superadmin-console"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getSuperadminManagementData } from "@/lib/management-data"

export const metadata: Metadata = {
  title: "Superadmin Control Center · Plexus",
  description: "Platform-wide Admin, Vendor, account, reporting, and audit controls.",
}

export default async function SuperadminLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const data = await getSuperadminManagementData(normalizedLocale)

  return <SuperadminConsole locale={normalizedLocale} {...data} />
}

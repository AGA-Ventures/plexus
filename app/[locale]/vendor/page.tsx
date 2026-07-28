import { notFound } from "next/navigation"

import { PlexusConnectMvp } from "@/components/malayconnect-mvp"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"

export default async function VendorLocalePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ section?: string | string[] }>
}) {
  const { locale } = await params
  const query = await searchParams

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const { db, session } = await getProtectedPortalData(
    normalizedLocale,
    "vendor"
  )

  if (!session.vendorType) {
    notFound()
  }

  return (
    <PlexusConnectMvp
      role={session.vendorType}
      locale={normalizedLocale}
      initialDb={db}
      session={session}
      initialVendorSection={
        typeof query.section === "string" ? query.section : undefined
      }
    />
  )
}

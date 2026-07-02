import { notFound } from "next/navigation"

import { PlexusConnectMvp } from "@/components/malayconnect-mvp"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"

export default async function PartnerLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const { db, session } = await getProtectedPortalData(normalizedLocale, "partner")

  return <PlexusConnectMvp role="partner" locale={normalizedLocale} initialDb={db} session={session} />
}

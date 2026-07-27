import { notFound } from "next/navigation"

import { PlexusConnectMvp } from "@/components/malayconnect-mvp"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getMeetingProviderReadiness } from "@/lib/meetings"
import { getProtectedPortalData } from "@/lib/plexus-data"

export default async function AdminLocalePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const { db, session } = await getProtectedPortalData(
    normalizedLocale,
    "admin"
  )
  const meetingProviderReadiness = await getMeetingProviderReadiness()

  return (
    <PlexusConnectMvp
      role="admin"
      locale={normalizedLocale}
      initialDb={db}
      session={session}
      meetingProviderReadiness={meetingProviderReadiness}
    />
  )
}

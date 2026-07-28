import { notFound } from "next/navigation"

import { PlexusConnectMvp } from "@/components/malayconnect-mvp"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getMeetingProviderReadiness } from "@/lib/meetings"
import { getProtectedPortalData } from "@/lib/plexus-data"

export default async function AdminLocalePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ section?: string | string[] }>
}) {
  const { locale } = await params
  const { section } = await searchParams

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
      initialAdminSection={Array.isArray(section) ? section[0] : section}
      meetingProviderReadiness={meetingProviderReadiness}
    />
  )
}

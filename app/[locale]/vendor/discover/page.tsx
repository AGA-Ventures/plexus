import { notFound } from "next/navigation"

import {
  MatchDiscovery,
  type MatchCandidate,
} from "@/components/match-discovery"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function VendorDiscoverPage({
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
    "vendor"
  )

  if (!session.vendorType) {
    notFound()
  }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc("match_candidates")
  const candidates = (data ?? []) as MatchCandidate[]
  const matchedIds =
    session.vendorType === "delegation"
      ? db.matches.map((match) => match.partnerId)
      : db.matches.map((match) => match.delegationId)

  return (
    <MatchDiscovery
      role={session.vendorType}
      locale={normalizedLocale}
      candidates={candidates}
      matchedIds={matchedIds}
    />
  )
}

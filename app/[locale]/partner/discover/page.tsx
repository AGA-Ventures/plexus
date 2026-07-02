import { notFound } from "next/navigation"

import { MatchDiscovery, type MatchCandidate } from "@/components/match-discovery"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getProtectedPortalData } from "@/lib/plexus-data"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function PartnerDiscoverPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const { db } = await getProtectedPortalData(normalizedLocale, "partner")

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc("match_candidates")
  const candidates = (data ?? []) as MatchCandidate[]
  const matchedIds = db.matches.map((match) => match.delegationId)

  return (
    <MatchDiscovery
      role="partner"
      locale={normalizedLocale}
      candidates={candidates}
      matchedIds={matchedIds}
    />
  )
}

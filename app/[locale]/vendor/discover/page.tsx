import { notFound, redirect } from "next/navigation"

import {
  MatchDiscovery,
  type MatchCandidate,
} from "@/components/match-discovery"
import { VendorWorkspaceRouteNavigation } from "@/components/malayconnect-mvp"
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

  if (session.tenantVendorDiscoveryEnabled === false) {
    redirect(`/${normalizedLocale}/vendor?section=matches`)
  }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.rpc("match_candidates")
  const candidates = (data ?? []) as MatchCandidate[]
  const matchedIds =
    session.vendorType === "delegation"
      ? db.matches.map((match) => match.partnerId)
      : db.matches.map((match) => match.delegationId)

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
          <VendorWorkspaceRouteNavigation
            locale={normalizedLocale}
            session={session}
            activeSection="matches"
          />
          <MatchDiscovery
            role={session.vendorType}
            locale={normalizedLocale}
            candidates={candidates}
            matchedIds={matchedIds}
          />
        </div>
      </div>
    </main>
  )
}

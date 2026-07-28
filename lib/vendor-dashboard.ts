import type {
  Deal,
  DelegationCompany,
  Match,
  Meeting,
  PartnerCompany,
} from "@/lib/local-db"

export type VendorRealtimeTarget = {
  table:
    | "delegation_companies"
    | "partner_companies"
    | "matches"
    | "meetings"
    | "deals"
  filter: string
}

export function getVendorDashboardMetrics({
  company,
  matches,
  meetings,
  deals,
}: {
  company: DelegationCompany | PartnerCompany
  matches: Match[]
  meetings: Meeting[]
  deals: Deal[]
}) {
  const pendingMatches = matches.filter(
    (match) => match.status === "Proposed"
  ).length
  const upcomingMeetings = meetings.filter((meeting) =>
    ["Scheduled", "Live"].includes(meeting.status)
  ).length
  const completedMeetings = meetings.filter(
    (meeting) => meeting.status === "Completed"
  ).length
  const companyDeals = deals.filter((deal) =>
    matches.some((match) => match.id === deal.matchId)
  )
  const activeMous = companyDeals.filter((deal) =>
    ["Under Discussion", "Agreement Reached"].includes(deal.status)
  ).length
  const signedMous = companyDeals.filter(
    (deal) => deal.status === "Signed"
  ).length

  return {
    profileComplete: company.profileComplete,
    profileRemaining: Math.max(0, 100 - company.profileComplete),
    pendingMatches,
    totalMatches: matches.length,
    upcomingMeetings,
    completedMeetings,
    activeMous,
    signedMous,
  }
}

export function getVendorRealtimeTargets({
  vendorType,
  vendorCompanyId,
  matchIds,
}: {
  vendorType: "delegation" | "partner"
  vendorCompanyId: string
  matchIds: string[]
}): VendorRealtimeTarget[] {
  const targets: VendorRealtimeTarget[] = [
    {
      table:
        vendorType === "delegation"
          ? "delegation_companies"
          : "partner_companies",
      filter: `id=eq.${vendorCompanyId}`,
    },
    {
      table: "matches",
      filter: `${
        vendorType === "delegation"
          ? "delegation_company_id"
          : "partner_company_id"
      }=eq.${vendorCompanyId}`,
    },
  ]
  const uniqueMatchIds = [...new Set(matchIds)].sort()

  if (uniqueMatchIds.length > 0) {
    const filter = `match_id=in.(${uniqueMatchIds.join(",")})`
    targets.push({ table: "meetings", filter }, { table: "deals", filter })
  }

  return targets
}

import { describe, expect, it } from "vitest"

import {
  getVendorDashboardMetrics,
  getVendorRealtimeTargets,
} from "@/lib/vendor-dashboard"
import type { Deal, DelegationCompany, Match, Meeting } from "@/lib/local-db"

const company = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "delegation",
  nameEn: "Example Co",
  nameCn: "",
  sector: "Technology",
  origin: "Macau",
  size: "11-50",
  needs: "Distribution",
  contact: "Example User",
  contactMeta: "user@example.com",
  status: "Incomplete",
  profileComplete: 64,
  urgent: false,
  coordinator: "Example User",
} satisfies DelegationCompany

const matches = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    delegationId: company.id,
    partnerId: "33333333-3333-4333-8333-333333333333",
    status: "Proposed",
    score: 75,
    note: "Potential fit",
    delegationAcceptedAt: null,
    partnerAcceptedAt: null,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    delegationId: company.id,
    partnerId: "55555555-5555-4555-8555-555555555555",
    status: "Session Scheduled",
    score: 90,
    note: "Strong fit",
    delegationAcceptedAt: "2026-07-28T00:00:00.000Z",
    partnerAcceptedAt: "2026-07-28T00:01:00.000Z",
  },
] satisfies Match[]

const meetings = [
  {
    id: "66666666-6666-4666-8666-666666666666",
    matchId: matches[1].id,
    startsAt: "2026-08-01T02:00:00.000Z",
    duration: 60,
    platform: "Zoom",
    link: "/m/example",
    interpreter: "",
    requestedInterpreterId: null,
    host: "Plexus",
    status: "Scheduled",
    summary: "",
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    matchId: matches[1].id,
    startsAt: "2026-07-20T02:00:00.000Z",
    duration: 60,
    platform: "Lark",
    link: "/m/completed",
    interpreter: "",
    requestedInterpreterId: null,
    host: "Plexus",
    status: "Completed",
    summary: "Completed",
  },
] satisfies Meeting[]

const deals = [
  {
    id: "88888888-8888-4888-8888-888888888888",
    matchId: matches[0].id,
    status: "Under Discussion",
    document: "",
    documentId: null,
    documentFileSize: null,
    documentUploadedAt: null,
    signatoryCheck: "Pending",
  },
  {
    id: "99999999-9999-4999-8999-999999999999",
    matchId: matches[1].id,
    status: "Signed",
    document: "agreement.pdf",
    documentId: null,
    documentFileSize: null,
    documentUploadedAt: null,
    signatoryCheck: "Verified",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    matchId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    status: "Agreement Reached",
    document: "",
    documentId: null,
    documentFileSize: null,
    documentUploadedAt: null,
    signatoryCheck: "Pending",
  },
] satisfies Deal[]

describe("Vendor dashboard", () => {
  it("derives every dashboard metric from the current scoped records", () => {
    expect(
      getVendorDashboardMetrics({ company, matches, meetings, deals })
    ).toEqual({
      profileComplete: 64,
      profileRemaining: 36,
      pendingMatches: 1,
      totalMatches: 2,
      upcomingMeetings: 1,
      completedMeetings: 1,
      activeMous: 1,
      signedMous: 1,
    })
  })

  it("builds tenant-scoped Realtime filters for a Delegation Vendor", () => {
    expect(
      getVendorRealtimeTargets({
        vendorType: "delegation",
        vendorCompanyId: company.id,
        matchIds: [matches[1].id, matches[0].id, matches[1].id],
      })
    ).toEqual([
      {
        table: "delegation_companies",
        filter: `id=eq.${company.id}`,
      },
      {
        table: "matches",
        filter: `delegation_company_id=eq.${company.id}`,
      },
      {
        table: "meetings",
        filter: `match_id=in.(${matches[0].id},${matches[1].id})`,
      },
      {
        table: "deals",
        filter: `match_id=in.(${matches[0].id},${matches[1].id})`,
      },
    ])
  })

  it("subscribes a Partner Vendor only to its own company and match rows", () => {
    expect(
      getVendorRealtimeTargets({
        vendorType: "partner",
        vendorCompanyId: "33333333-3333-4333-8333-333333333333",
        matchIds: [],
      })
    ).toEqual([
      {
        table: "partner_companies",
        filter: "id=eq.33333333-3333-4333-8333-333333333333",
      },
      {
        table: "matches",
        filter: "partner_company_id=eq.33333333-3333-4333-8333-333333333333",
      },
    ])
  })
})

import { describe, expect, it } from "vitest"

import {
  getPendingMeetingProposal,
  getVendorMeetingProposalState,
} from "@/lib/meeting-proposals"
import type { MeetingProposal } from "@/lib/local-db"

const proposal: MeetingProposal = {
  id: "proposal-1",
  matchId: "match-1",
  startsAt: "2026-08-05T03:00:00.000Z",
  duration: 60,
  requestedInterpreterId: null,
  requestedByVendorType: "partner",
  requestedByVendorCompanyId: "partner-1",
  delegationApprovedAt: null,
  partnerApprovedAt: "2026-07-30T03:00:00.000Z",
  status: "pending",
  meetingId: null,
}

describe("Vendor meeting proposal state", () => {
  it("asks the counterpart to approve a one-sided proposal", () => {
    expect(getVendorMeetingProposalState(proposal, "delegation")).toBe(
      "approval_needed"
    )
  })

  it("keeps the proposer waiting for the other Vendor", () => {
    expect(getVendorMeetingProposalState(proposal, "partner")).toBe(
      "awaiting_other_vendor"
    )
  })

  it("treats mutual approval as approved", () => {
    expect(
      getVendorMeetingProposalState(
        {
          ...proposal,
          delegationApprovedAt: "2026-07-30T03:05:00.000Z",
          status: "approved",
          meetingId: "meeting-1",
        },
        "partner"
      )
    ).toBe("approved")
  })

  it("returns only a pending proposal for the requested match", () => {
    expect(
      getPendingMeetingProposal(
        [
          {
            ...proposal,
            id: "approved-proposal",
            status: "approved",
            meetingId: "meeting-1",
          },
          proposal,
        ],
        "match-1"
      )
    ).toEqual(proposal)
  })
})

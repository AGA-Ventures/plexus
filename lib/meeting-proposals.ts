import type { VendorType } from "@/lib/auth"
import type { MeetingProposal } from "@/lib/local-db"

export type VendorMeetingProposalState =
  | "approval_needed"
  | "awaiting_other_vendor"
  | "approved"

export function getVendorMeetingProposalState(
  proposal: MeetingProposal,
  perspective: VendorType
): VendorMeetingProposalState {
  if (
    proposal.status === "approved" ||
    (proposal.delegationApprovedAt && proposal.partnerApprovedAt)
  ) {
    return "approved"
  }

  const ownApproved =
    perspective === "delegation"
      ? proposal.delegationApprovedAt
      : proposal.partnerApprovedAt

  return ownApproved ? "awaiting_other_vendor" : "approval_needed"
}

export function getPendingMeetingProposal(
  proposals: MeetingProposal[],
  matchId: string
) {
  return proposals.find(
    (proposal) => proposal.matchId === matchId && proposal.status === "pending"
  )
}

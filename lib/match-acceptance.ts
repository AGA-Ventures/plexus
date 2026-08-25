import type { VendorType } from "@/lib/auth"
import type { MatchStatus, MeetingStatus } from "@/lib/local-db"

export type VendorMatchProgress =
  | "awaiting_acceptance"
  | "your_acceptance_needed"
  | "pending_other_vendor"
  | "pending_meeting"
  | "meeting_scheduled"

export function buildVendorAcceptanceUpdate(
  vendorType: VendorType,
  acceptedAt: string
) {
  return {
    status: "Proposed" as const,
    ...(vendorType === "delegation"
      ? { delegation_accepted_at: acceptedAt }
      : { partner_accepted_at: acceptedAt }),
  }
}

export function buildVendorAcceptanceWithdrawalUpdate(vendorType: VendorType) {
  return {
    status: "Proposed" as const,
    ...(vendorType === "delegation"
      ? { delegation_accepted_at: null }
      : { partner_accepted_at: null }),
  }
}

export function canVendorWithdrawAcceptance(input: {
  ownAccepted: boolean
  counterpartAccepted: boolean
  meetingExists: boolean
}) {
  return input.ownAccepted && !input.counterpartAccepted && !input.meetingExists
}

export function getVendorMatchProgress(input: {
  ownAccepted: boolean
  counterpartAccepted: boolean
  meetingScheduled: boolean
}): VendorMatchProgress {
  if (
    input.ownAccepted &&
    input.counterpartAccepted &&
    input.meetingScheduled
  ) {
    return "meeting_scheduled"
  }
  if (input.ownAccepted && input.counterpartAccepted) {
    return "pending_meeting"
  }
  if (input.ownAccepted) {
    return "pending_other_vendor"
  }
  if (input.counterpartAccepted) {
    return "your_acceptance_needed"
  }
  return "awaiting_acceptance"
}

export function isFutureMeeting(
  meeting: {
    startsAt: string
    durationMinutes: number
    status: MeetingStatus
  },
  now = Date.now()
) {
  if (meeting.status === "Completed" || meeting.status === "Cancelled") {
    return false
  }

  const startsAt = new Date(meeting.startsAt).getTime()

  return Number.isFinite(startsAt) && startsAt > now
}

export function canScheduleAcceptedMatchMeeting(input: {
  bothAccepted: boolean
  matchStatus: MatchStatus
  futureMeetingExists: boolean
}) {
  return (
    input.bothAccepted &&
    ["Accepted", "Session Scheduled"].includes(input.matchStatus) &&
    !input.futureMeetingExists
  )
}

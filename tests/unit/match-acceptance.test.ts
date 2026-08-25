import { describe, expect, it } from "vitest"

import {
  buildVendorAcceptanceUpdate,
  buildVendorAcceptanceWithdrawalUpdate,
  canScheduleAcceptedMatchMeeting,
  canVendorWithdrawAcceptance,
  getVendorMatchProgress,
  isFutureMeeting,
} from "@/lib/match-acceptance"

describe("buildVendorAcceptanceUpdate", () => {
  it("reopens a Delegation match while recording only its acceptance", () => {
    expect(
      buildVendorAcceptanceUpdate("delegation", "2026-07-30T10:00:00.000Z")
    ).toEqual({
      status: "Proposed",
      delegation_accepted_at: "2026-07-30T10:00:00.000Z",
    })
  })

  it("reopens a Partner match while recording only its acceptance", () => {
    expect(
      buildVendorAcceptanceUpdate("partner", "2026-07-30T10:00:00.000Z")
    ).toEqual({
      status: "Proposed",
      partner_accepted_at: "2026-07-30T10:00:00.000Z",
    })
  })
})

describe("buildVendorAcceptanceWithdrawalUpdate", () => {
  it("clears only a Delegation Vendor acceptance", () => {
    expect(buildVendorAcceptanceWithdrawalUpdate("delegation")).toEqual({
      status: "Proposed",
      delegation_accepted_at: null,
    })
  })

  it("clears only a Partner Vendor acceptance", () => {
    expect(buildVendorAcceptanceWithdrawalUpdate("partner")).toEqual({
      status: "Proposed",
      partner_accepted_at: null,
    })
  })
})

describe("canVendorWithdrawAcceptance", () => {
  it("allows withdrawal only while acceptance is one-sided and no meeting exists", () => {
    expect(
      canVendorWithdrawAcceptance({
        ownAccepted: true,
        counterpartAccepted: false,
        meetingExists: false,
      })
    ).toBe(true)
  })

  it.each([
    {
      ownAccepted: false,
      counterpartAccepted: false,
      meetingExists: false,
    },
    {
      ownAccepted: true,
      counterpartAccepted: true,
      meetingExists: false,
    },
    {
      ownAccepted: true,
      counterpartAccepted: false,
      meetingExists: true,
    },
  ])("locks withdrawal for $input", (input) => {
    expect(canVendorWithdrawAcceptance(input)).toBe(false)
  })
})

describe("getVendorMatchProgress", () => {
  it.each([
    [
      {
        ownAccepted: false,
        counterpartAccepted: false,
        meetingScheduled: false,
      },
      "awaiting_acceptance",
    ],
    [
      {
        ownAccepted: false,
        counterpartAccepted: false,
        meetingScheduled: true,
      },
      "awaiting_acceptance",
    ],
    [
      {
        ownAccepted: false,
        counterpartAccepted: true,
        meetingScheduled: false,
      },
      "your_acceptance_needed",
    ],
    [
      {
        ownAccepted: true,
        counterpartAccepted: false,
        meetingScheduled: false,
      },
      "pending_other_vendor",
    ],
    [
      {
        ownAccepted: true,
        counterpartAccepted: true,
        meetingScheduled: false,
      },
      "pending_meeting",
    ],
    [
      {
        ownAccepted: true,
        counterpartAccepted: true,
        meetingScheduled: true,
      },
      "meeting_scheduled",
    ],
  ] as const)("derives %s", (input, expected) => {
    expect(getVendorMatchProgress(input)).toBe(expected)
  })
})

describe("meeting scheduling state", () => {
  const now = new Date("2026-07-30T04:00:00.000Z").getTime()

  it("treats only future meetings as viewable from a match card", () => {
    expect(
      isFutureMeeting(
        {
          startsAt: "2026-07-30T05:00:00.000Z",
          durationMinutes: 60,
          status: "Scheduled",
        },
        now
      )
    ).toBe(true)
    expect(
      isFutureMeeting(
        {
          startsAt: "2026-07-30T03:30:00.000Z",
          durationMinutes: 60,
          status: "Live",
        },
        now
      )
    ).toBe(false)
  })

  it("ignores ended, completed, cancelled, and invalid meetings", () => {
    expect(
      isFutureMeeting(
        {
          startsAt: "2026-07-30T02:00:00.000Z",
          durationMinutes: 60,
          status: "Scheduled",
        },
        now
      )
    ).toBe(false)
    expect(
      isFutureMeeting(
        {
          startsAt: "2026-07-30T05:00:00.000Z",
          durationMinutes: 60,
          status: "Completed",
        },
        now
      )
    ).toBe(false)
    expect(
      isFutureMeeting(
        {
          startsAt: "2026-07-30T05:00:00.000Z",
          durationMinutes: 60,
          status: "Cancelled",
        },
        now
      )
    ).toBe(false)
    expect(
      isFutureMeeting(
        {
          startsAt: "not-a-date",
          durationMinutes: 60,
          status: "Scheduled",
        },
        now
      )
    ).toBe(false)
  })

  it("allows another meeting after history ends but blocks an active one", () => {
    expect(
      canScheduleAcceptedMatchMeeting({
        bothAccepted: true,
        matchStatus: "Session Scheduled",
        futureMeetingExists: false,
      })
    ).toBe(true)
    expect(
      canScheduleAcceptedMatchMeeting({
        bothAccepted: true,
        matchStatus: "Accepted",
        futureMeetingExists: true,
      })
    ).toBe(false)
    expect(
      canScheduleAcceptedMatchMeeting({
        bothAccepted: false,
        matchStatus: "Proposed",
        futureMeetingExists: false,
      })
    ).toBe(false)
  })
})

import { describe, expect, it } from "vitest"

import {
  extractMeetingAgenda,
  validateManualMeetingInput,
  validateMeetingAmendmentInput,
} from "@/lib/manual-meeting"

const validInput = {
  delegationId: "11111111-1111-4111-8111-111111111111",
  partnerId: "22222222-2222-4222-8222-222222222222",
  platform: "zoom" as const,
  startsAt: "2026-08-10T03:00:00.000Z",
  durationMinutes: 60,
  requestedInterpreterId: null,
  agenda: "Product introduction and distribution next steps.",
}

describe("manual meeting input", () => {
  it("accepts a complete future tenant meeting request", () => {
    expect(
      validateManualMeetingInput(
        validInput,
        new Date("2026-07-28T00:00:00.000Z")
      )
    ).toEqual({ success: true, data: validInput })
  })

  it("rejects stale meeting times", () => {
    expect(
      validateManualMeetingInput(
        validInput,
        new Date("2026-08-10T03:00:00.000Z")
      )
    ).toEqual({
      success: false,
      error: "Choose a future meeting time.",
    })
  })

  it("rejects malformed ids, unsupported durations, and short agendas", () => {
    const result = validateManualMeetingInput(
      {
        ...validInput,
        delegationId: "not-a-company",
        platform: "voov",
        durationMinutes: 10,
        agenda: "x",
      },
      new Date("2026-07-28T00:00:00.000Z")
    )

    expect(result).toEqual({
      success: false,
      error:
        "Complete the Vendor, platform, schedule, duration, and agenda fields.",
    })
  })

  it("limits accidental schedules more than two years ahead", () => {
    expect(
      validateManualMeetingInput(
        { ...validInput, startsAt: "2029-08-10T03:00:00.000Z" },
        new Date("2026-07-28T00:00:00.000Z")
      )
    ).toEqual({
      success: false,
      error: "Meeting dates can be scheduled up to two years ahead.",
    })
  })
})

describe("meeting amendment input", () => {
  const amendment = {
    meetingId: "33333333-3333-4333-8333-333333333333",
    platform: "lark" as const,
    startsAt: "2026-08-11T03:00:00.000Z",
    durationMinutes: 90,
    requestedInterpreterId: null,
    agenda: "Confirm the commercial workplan and owners.",
  }

  it("accepts safe operational changes for a future meeting", () => {
    expect(
      validateMeetingAmendmentInput(
        amendment,
        new Date("2026-07-28T00:00:00.000Z")
      )
    ).toEqual({ success: true, data: amendment })
  })

  it("rejects malformed meeting amendments", () => {
    expect(
      validateMeetingAmendmentInput(
        {
          ...amendment,
          meetingId: "wrong-meeting",
          platform: "voov",
          agenda: "x",
        },
        new Date("2026-07-28T00:00:00.000Z")
      )
    ).toEqual({
      success: false,
      error:
        "Complete the platform, schedule, duration, interpreter, and agenda fields.",
    })
  })

  it("extracts the editable agenda without provider-link notes", () => {
    expect(
      extractMeetingAgenda(
        "Admin-arranged meeting. Preferred provider: Zoom. Agenda: Product introduction and next steps. The calendar slot is confirmed; a protected link is pending."
      )
    ).toBe("Product introduction and next steps.")
  })
})

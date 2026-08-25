import { describe, expect, it } from "vitest"

import {
  defaultMeetingAvailability,
  getMeetingDateOptions,
  getMeetingSlotOptions,
  getMeetingTimeSlotsForDate,
  isMeetingSlotAvailable,
  normalizeMeetingAvailability,
} from "@/lib/meeting-availability"

describe("getMeetingSlotOptions", () => {
  it("offers the next five Kuala Lumpur working days", () => {
    const now = new Date("2026-07-30T04:00:00.000Z")
    const slots = getMeetingSlotOptions(now)

    expect(slots).toHaveLength(20)
    expect(slots[0]).toBe("2026-07-31T10:00:00+08:00")
    expect(slots.at(-1)).toBe("2026-08-06T15:00:00+08:00")
    expect(
      slots.every((slot) => new Date(slot).getTime() > now.getTime())
    ).toBe(true)
    expect(
      slots.every((slot) => {
        const weekday = new Date(slot).getUTCDay()
        return weekday >= 1 && weekday <= 5
      })
    ).toBe(true)
  })

  it("crosses year boundaries without offering weekends", () => {
    const slots = getMeetingSlotOptions(new Date("2026-12-31T12:00:00.000Z"), 2)

    expect(slots).toEqual([
      "2027-01-01T10:00:00+08:00",
      "2027-01-01T11:00:00+08:00",
      "2027-01-01T14:00:00+08:00",
      "2027-01-01T15:00:00+08:00",
      "2027-01-04T10:00:00+08:00",
      "2027-01-04T11:00:00+08:00",
      "2027-01-04T14:00:00+08:00",
      "2027-01-04T15:00:00+08:00",
    ])
  })

  it("offers dates first and only the configured times for that weekday", () => {
    const availability = normalizeMeetingAvailability({
      "1": ["09:00", "16:00"],
      "2": [],
      "3": [],
      "4": [],
      "5": ["11:00"],
    })
    const now = new Date("2026-07-30T04:00:00.000Z")
    const dates = getMeetingDateOptions(availability, now, 3)

    expect(dates).toEqual(["2026-07-31", "2026-08-03", "2026-08-07"])
    expect(getMeetingTimeSlotsForDate(dates[0]!, availability, now)).toEqual([
      "2026-07-31T11:00:00+08:00",
    ])
    expect(getMeetingTimeSlotsForDate(dates[1]!, availability, now)).toEqual([
      "2026-08-03T09:00:00+08:00",
      "2026-08-03T16:00:00+08:00",
    ])
  })

  it("recognizes only future slots opened by the tenant", () => {
    const now = new Date("2026-07-30T04:00:00.000Z")

    expect(
      isMeetingSlotAvailable(
        "2026-07-31T10:00:00+08:00",
        defaultMeetingAvailability,
        now
      )
    ).toBe(true)
    expect(
      isMeetingSlotAvailable(
        "2026-07-31T09:00:00+08:00",
        defaultMeetingAvailability,
        now
      )
    ).toBe(false)
    expect(
      isMeetingSlotAvailable(
        "2026-07-25T10:00:00+08:00",
        defaultMeetingAvailability,
        now
      )
    ).toBe(false)
  })

  it("shows no dates when the Admin closes every slot", () => {
    const availability = normalizeMeetingAvailability({
      "1": [],
      "2": [],
      "3": [],
      "4": [],
      "5": [],
    })

    expect(
      getMeetingDateOptions(availability, new Date("2026-07-30T04:00:00.000Z"))
    ).toEqual([])
  })
})

import { describe, expect, it } from "vitest"

import {
  formatCountdown,
  getMeetingCountdown,
  splitCountdown,
} from "@/lib/meeting-countdown"

const UNITS = { day: "d", hour: "h", minute: "m", second: "s" }
const START = new Date("2026-07-28T10:00:00.000Z").getTime()
const MINUTE = 60 * 1000

function countdownAt(offsetMs: number, durationMinutes = 60) {
  return getMeetingCountdown({
    now: START + offsetMs,
    startsAt: START,
    durationMinutes,
  })
}

describe("meeting countdown", () => {
  it("counts down to the start before the meeting", () => {
    expect(countdownAt(-90 * MINUTE)).toEqual({
      phase: "before",
      ms: 90 * MINUTE,
    })
  })

  it("switches to time remaining once the meeting starts", () => {
    expect(countdownAt(0)).toEqual({ phase: "live", ms: 60 * MINUTE })
    expect(countdownAt(45 * MINUTE)).toEqual({ phase: "live", ms: 15 * MINUTE })
  })

  it("stays live through the final instant, then reports elapsed time", () => {
    expect(countdownAt(60 * MINUTE)?.phase).toBe("live")
    expect(countdownAt(60 * MINUTE + 1)).toEqual({ phase: "ended", ms: 1 })
    expect(countdownAt(75 * MINUTE)).toEqual({
      phase: "ended",
      ms: 15 * MINUTE,
    })
  })

  it("returns nothing for an unparseable schedule", () => {
    expect(
      getMeetingCountdown({
        now: START,
        startsAt: Number.NaN,
        durationMinutes: 60,
      })
    ).toBeNull()
  })

  it("treats a nonsense duration as a zero-length meeting", () => {
    expect(countdownAt(1, Number.NaN)).toEqual({ phase: "ended", ms: 1 })
    expect(countdownAt(1, -30)).toEqual({ phase: "ended", ms: 1 })
  })

  it("shows the two most significant units at every scale", () => {
    expect(formatCountdown(3 * 86_400_000 + 4 * 3_600_000, UNITS)).toBe("3d 4h")
    expect(formatCountdown(2 * 3_600_000 + 15 * MINUTE, UNITS)).toBe("2h 15m")
    expect(formatCountdown(45 * MINUTE + 30_000, UNITS)).toBe("45m 30s")
    expect(formatCountdown(30_000, UNITS)).toBe("30s")
    expect(formatCountdown(0, UNITS)).toBe("0s")
    expect(formatCountdown(-5_000, UNITS)).toBe("0s")
  })

  it("splits a span into whole units", () => {
    expect(splitCountdown(90_061_000)).toEqual({
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
    })
  })
})

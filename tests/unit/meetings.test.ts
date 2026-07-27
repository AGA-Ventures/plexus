import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  buildMeetingShareUrl,
  getMeetingWindowStatus,
  normalizeMeetingDuration,
  normalizeMeetingStart,
} from "@/lib/meetings"

describe("secure meeting helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.plexus.enterprises")
  })

  it("clamps meeting durations into the supported window", () => {
    expect(normalizeMeetingDuration(1)).toBe(30)
    expect(normalizeMeetingDuration(60.4)).toBe(60)
    expect(normalizeMeetingDuration(999)).toBe(480)
    expect(normalizeMeetingDuration(Number.NaN)).toBe(60)
  })

  it("uses an immediate start for missing, invalid, or stale preferences", () => {
    const now = new Date("2026-07-28T10:00:00.000Z")
    const future = new Date("2026-07-28T11:00:00.000Z")

    expect(normalizeMeetingStart(undefined, now)).toBe(now)
    expect(normalizeMeetingStart(new Date("invalid"), now)).toBe(now)
    expect(
      normalizeMeetingStart(new Date("2026-07-28T09:00:00.000Z"), now)
    ).toBe(now)
    expect(normalizeMeetingStart(future, now)).toBe(future)
  })

  it("builds only the wrapped share URL", () => {
    expect(buildMeetingShareUrl("a".repeat(32))).toBe(
      `https://www.plexus.enterprises/m/${"a".repeat(32)}`
    )
  })

  it.each([
    [
      { now: 5, availableAt: 10, expiresAt: 20, openCount: 0, maxOpens: 10 },
      "not_started",
    ],
    [
      { now: 21, availableAt: 10, expiresAt: 20, openCount: 0, maxOpens: 10 },
      "expired",
    ],
    [
      { now: 15, availableAt: 10, expiresAt: 20, openCount: 10, maxOpens: 10 },
      "access_limit",
    ],
    [
      { now: 15, availableAt: 10, expiresAt: 20, openCount: 9, maxOpens: 10 },
      "active",
    ],
  ] as const)("classifies the gate window", (input, expected) => {
    expect(getMeetingWindowStatus(input)).toBe(expected)
  })
})

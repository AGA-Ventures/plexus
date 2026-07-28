import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  buildMeetingShareUrl,
  getMeetingJoinWindow,
  getMeetingWindowStatus,
  normalizeMeetingDuration,
  normalizeMeetingStart,
} from "@/lib/meetings"
import { classifyMeetingProviderReadiness } from "@/lib/meeting-provider-readiness"

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

  it("opens the join window before the start and past the scheduled end", () => {
    const startsAt = new Date("2026-07-28T10:00:00.000Z")
    const { availableAt, expiresAt } = getMeetingJoinWindow(startsAt, 60)

    expect(availableAt.toISOString()).toBe("2026-07-28T09:45:00.000Z")
    expect(expiresAt.toISOString()).toBe("2026-07-28T11:30:00.000Z")

    // A participant arriving ten minutes early can still open the link.
    expect(
      getMeetingWindowStatus({
        now: startsAt.getTime() - 10 * 60 * 1000,
        availableAt: availableAt.getTime(),
        expiresAt: expiresAt.getTime(),
        openCount: 0,
        maxOpens: 10,
      })
    ).toBe("active")
  })

  it("builds only the wrapped share URL", () => {
    expect(buildMeetingShareUrl("a".repeat(32))).toBe(
      `https://www.plexus.enterprises/m/${"a".repeat(32)}`
    )
  })

  it("reports provider setup and authorization requirements without exposing configuration", () => {
    expect(
      classifyMeetingProviderReadiness({
        zoomConfigured: false,
        larkConfigured: false,
        larkAuthorized: false,
        protectedLinksConfigured: false,
      })
    ).toEqual({
      zoom: {
        configured: false,
        state: "setup_required",
      },
      lark: {
        authorized: false,
        configured: false,
        state: "setup_required",
      },
      protectedLinksConfigured: false,
    })

    expect(
      classifyMeetingProviderReadiness({
        zoomConfigured: true,
        larkConfigured: true,
        larkAuthorized: false,
        protectedLinksConfigured: true,
      })
    ).toMatchObject({
      zoom: { state: "online" },
      lark: { state: "authorization_required" },
    })
  })

  it("reports providers online only when protected meeting creation is ready", () => {
    expect(
      classifyMeetingProviderReadiness({
        zoomConfigured: true,
        larkConfigured: true,
        larkAuthorized: true,
        protectedLinksConfigured: true,
      })
    ).toMatchObject({
      zoom: { state: "online" },
      lark: { state: "online" },
      protectedLinksConfigured: true,
    })
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

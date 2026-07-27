import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { createZoomMeeting, resetZoomTokenCacheForTests } from "@/lib/zoom"

describe("Zoom meeting provider", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test")
    vi.stubEnv("ZOOM_ACCOUNT_ID", "account-id")
    vi.stubEnv("ZOOM_CLIENT_ID", "client-id")
    vi.stubEnv("ZOOM_CLIENT_SECRET", "client-secret")
    resetZoomTokenCacheForTests()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("caches its token and returns only attendee-safe meeting fields", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        Response.json({ access_token: "zoom-token", expires_in: 3600 })
      )
      .mockResolvedValueOnce(
        Response.json({
          id: 123456789,
          join_url: "https://zoom.us/j/123456789",
          start_url: "https://zoom.us/s/host-secret",
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          id: 987654321,
          join_url: "https://zoom.us/j/987654321",
          start_url: "https://zoom.us/s/another-host-secret",
        })
      )

    vi.stubGlobal("fetch", fetchMock)

    const first = await createZoomMeeting({
      topic: "Mutually accepted meeting",
      durationMinutes: 60,
      startsAt: new Date("2026-07-28T10:00:00.000Z"),
    })
    const second = await createZoomMeeting({
      topic: "Second meeting",
      durationMinutes: 30,
      startsAt: new Date("2026-07-28T12:00:00.000Z"),
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(first).toEqual({
      joinUrl: "https://zoom.us/j/123456789",
      providerMeetingId: "123456789",
    })
    expect(second.providerMeetingId).toBe("987654321")
    expect(JSON.stringify([first, second])).not.toContain("start_url")
    expect(JSON.stringify([first, second])).not.toContain("host-secret")
  })
})

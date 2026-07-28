import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  classifyMeetingCreationFailure,
  getAutomaticMeetingProvider,
  getPreferredMeetingProvider,
  meetingCreationFailureSummary,
} from "@/lib/meeting-automation"

describe("automatic meeting creation policy", () => {
  it("defaults to Zoom and accepts an explicit Lark default", () => {
    expect(getAutomaticMeetingProvider(undefined)).toBe("zoom")
    expect(getAutomaticMeetingProvider("zoom")).toBe("zoom")
    expect(getAutomaticMeetingProvider("LARK")).toBe("lark")
    expect(getAutomaticMeetingProvider("unexpected")).toBe("zoom")
  })

  it("honors a stored manual-meeting platform before the tenant default", () => {
    expect(getPreferredMeetingProvider("Zoom", "lark")).toBe("zoom")
    expect(getPreferredMeetingProvider("Lark", "zoom")).toBe("lark")
    expect(getPreferredMeetingProvider("Pending", "lark")).toBe("lark")
  })

  it.each([
    ["Missing required Zoom configuration: ZOOM_CLIENT_ID.", "configuration"],
    ["Lark is not authorized. Sign in once.", "authorization"],
    ["Zoom meeting creation failed with HTTP 429.", "rate_limited"],
    ["AbortError: request timed out", "timeout"],
    ["Unable to store the protected meeting link.", "storage_error"],
    [
      "Both Vendors must accept before creating a meeting.",
      "agreement_changed",
    ],
    ["Zoom returned an invalid meeting response.", "provider_error"],
  ] as const)("classifies %s as %s", (message, expected) => {
    expect(classifyMeetingCreationFailure(new Error(message))).toBe(expected)
  })

  it("returns fixed safe summaries rather than provider error content", () => {
    const secretBearingError =
      "Zoom failed with client_secret=do-not-expose and token=private"
    const code = classifyMeetingCreationFailure(new Error(secretBearingError))
    const summary = meetingCreationFailureSummary(code)

    expect(summary).toBe(
      "The meeting provider rejected or returned an invalid meeting."
    )
    expect(summary).not.toContain("do-not-expose")
    expect(summary).not.toContain("private")
  })
})

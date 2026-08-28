import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getEvent: vi.fn(),
  insert: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock("@/lib/tchina-expo-server", () => ({
  getPublishedTChinaEvent: mocks.getEvent,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      insert: (...args: unknown[]) => {
        mocks.insert(...args)
        return {
          select: () => ({ maybeSingle: mocks.maybeSingle }),
        }
      },
    }),
  }),
}))

import { POST } from "@/app/api/tchina-expo/registrations/route"

function body() {
  return {
    locale: "en",
    attendeeType: "general_visitor",
    fullName: "Amina Tan",
    email: "Amina@Example.COM",
    mobileNumber: "+60 12 345 6789",
    chatPlatform: "none",
    chatId: "",
    countryRegion: "Malaysia",
    preferredLanguage: "en",
    attendanceDates: ["2026-08-31"],
    consent: true,
    websiteConfirm: "",
    visitor: {
      organization: "Example Association",
      position: "Member",
      industryInterests: ["Technology"],
      visitPurpose: "Explore suppliers.",
    },
  }
}

function request(value: unknown, headers: HeadersInit = {}) {
  return new Request("https://plexus.example/api/tchina-expo/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof value === "string" ? value : JSON.stringify(value),
  })
}

describe("POST /api/tchina-expo/registrations", () => {
  beforeEach(() => {
    mocks.getEvent.mockReset()
    mocks.insert.mockReset()
    mocks.maybeSingle.mockReset()
    mocks.getEvent.mockResolvedValue({
      id: "91000000-0000-4000-8000-000000000001",
    })
    mocks.maybeSingle.mockResolvedValue({
      data: { id: "93000000-0000-4000-8000-000000000001" },
      error: null,
    })
  })

  it("rejects malformed and oversized requests before event resolution", async () => {
    const malformed = await POST(request("{"))
    const oversized = await POST(
      request("{}", { "content-length": String(64 * 1024 + 1) })
    )

    expect(malformed.status).toBe(400)
    expect(oversized.status).toBe(413)
    expect(mocks.getEvent).not.toHaveBeenCalled()
  })

  it("returns generic success without storage for the honeypot", async () => {
    const response = await POST(
      request({ ...body(), websiteConfirm: "https://bot.example" })
    )

    expect(await response.json()).toEqual({ ok: true, submitted: true })
    expect(mocks.getEvent).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("denies an unpublished Plexus event", async () => {
    mocks.getEvent.mockResolvedValue(null)
    const response = await POST(request(body()))

    expect(response.status).toBe(404)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("uses server-owned event scope and normalized contact data", async () => {
    const response = await POST(request(body()))

    expect(response.status).toBe(200)
    expect(mocks.getEvent).toHaveBeenCalledWith()
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        event_id: "91000000-0000-4000-8000-000000000001",
        normalized_email: "amina@example.com",
        mobile_number: "+60123456789",
      })
    )
    expect(mocks.insert.mock.calls[0]?.[0]).not.toHaveProperty("admin_id")
  })

  it("uses the submitted email for the Email contact method", async () => {
    const response = await POST(
      request({
        ...body(),
        chatPlatform: "email",
        chatId: "untrusted@example.invalid",
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        chat_platform: "email",
        chat_id: "amina@example.com",
      })
    )
  })

  it("returns the same success response for new and duplicate submissions", async () => {
    const created = await POST(request(body()))
    mocks.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: "23505" },
    })
    const duplicate = await POST(request(body()))

    expect(await created.json()).toEqual({ ok: true, submitted: true })
    expect(await duplicate.json()).toEqual({ ok: true, submitted: true })
  })
})

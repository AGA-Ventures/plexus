import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  sendPublicEnquiryEmail: vi.fn(),
}))

vi.mock("@/lib/public-enquiry-email", () => ({
  sendPublicEnquiryEmail: mocks.sendPublicEnquiryEmail,
}))

import { POST } from "@/app/api/public-enquiries/route"

const validEnquiry = {
  name: "Aisha Lim",
  organisation: "Example Chamber",
  email: "aisha@example.com",
  phone: "+60 12 345 6789",
  enquiryType: "pricing",
  message: "We would like a proposal for our 2027 trade program.",
  locale: "en",
  sourcePage: "pricing",
  websiteConfirm: "",
}

function request(body: unknown, headers?: HeadersInit) {
  return new Request("https://plexus.example/api/public-enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

describe("POST /api/public-enquiries", () => {
  beforeEach(() => {
    mocks.sendPublicEnquiryEmail.mockReset()
    mocks.sendPublicEnquiryEmail.mockResolvedValue({ ok: true })
  })

  it("rejects malformed, oversized, and invalid requests before email delivery", async () => {
    const malformed = await POST(request("{"))
    const oversized = await POST(
      request("{}", { "content-length": String(64 * 1024 + 1) })
    )
    const invalid = await POST(
      request({ ...validEnquiry, email: "not-an-email" })
    )

    expect(malformed.status).toBe(400)
    expect(oversized.status).toBe(413)
    expect(invalid.status).toBe(400)
    expect(await invalid.json()).toMatchObject({
      error: "validation_failed",
      fieldErrors: { email: "invalidEmail" },
    })
    expect(mocks.sendPublicEnquiryEmail).not.toHaveBeenCalled()
  })

  it("returns generic success for a completed honeypot without sending email", async () => {
    const response = await POST(
      request({ ...validEnquiry, websiteConfirm: "https://bot.example" })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, submitted: true })
    expect(mocks.sendPublicEnquiryEmail).not.toHaveBeenCalled()
  })

  it("keeps an incomplete honeypot submission indistinguishable from success", async () => {
    const response = await POST(request({ websiteConfirm: "bot" }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, submitted: true })
    expect(mocks.sendPublicEnquiryEmail).not.toHaveBeenCalled()
  })

  it("sends a valid enquiry with its trusted server-bound context", async () => {
    const response = await POST(request(validEnquiry))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, submitted: true })
    expect(mocks.sendPublicEnquiryEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        enquiryType: "pricing",
        locale: "en",
        sourcePage: "pricing",
      })
    )
  })

  it.each(["service_unavailable", "delivery_failed"])(
    "reports %s truthfully without losing the client-side payload",
    async (reason) => {
      mocks.sendPublicEnquiryEmail.mockResolvedValueOnce({ ok: false, reason })

      const response = await POST(request(validEnquiry))

      expect(response.status).toBe(503)
      expect(await response.json()).toEqual({ ok: false, error: reason })
    }
  )
})

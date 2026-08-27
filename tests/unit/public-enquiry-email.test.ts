import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send }
  },
}))

import { sendPublicEnquiryEmail } from "@/lib/public-enquiry-email"

const enquiry = {
  name: "Aisha Lim",
  organisation: "Example Chamber",
  email: " Aisha@Example.COM ",
  phone: "+60 12 345 6789",
  enquiryType: "pricing" as const,
  message: "We would like a proposal for our 2027 trade program.",
  locale: "en" as const,
  sourcePage: "pricing" as const,
  websiteConfirm: "",
}

describe("public enquiry email delivery", () => {
  beforeEach(() => {
    mocks.send.mockReset()
    vi.stubEnv("PLEXUS_PUBLIC_CONTACT_EMAIL", "admin@ylinspiration.com")
    vi.stubEnv("PLEXUS_EMAIL_FROM", "Plexus <notifications@example.com>")
    vi.stubEnv("RESEND_API_KEY", "re_test")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("fails closed when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "")

    await expect(sendPublicEnquiryEmail(enquiry)).resolves.toEqual({
      ok: false,
      reason: "service_unavailable",
    })
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it("fails closed when the public recipient is not configured", async () => {
    vi.stubEnv("PLEXUS_PUBLIC_CONTACT_EMAIL", "")

    await expect(sendPublicEnquiryEmail(enquiry)).resolves.toEqual({
      ok: false,
      reason: "service_unavailable",
    })
    expect(mocks.send).not.toHaveBeenCalled()
  })

  it("sends only to the configured mailbox with the visitor as reply-to", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email_123" }, error: null })

    await expect(sendPublicEnquiryEmail(enquiry)).resolves.toEqual({ ok: true })
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Plexus <notifications@example.com>",
        to: ["admin@ylinspiration.com"],
        replyTo: "aisha@example.com",
        subject: "Plexus enquiry: pricing",
        text: expect.stringContaining("Source page: pricing"),
      })
    )
  })

  it("reports a provider rejection without returning provider detail", async () => {
    mocks.send.mockResolvedValue({ data: null, error: { message: "Rejected" } })

    await expect(sendPublicEnquiryEmail(enquiry)).resolves.toEqual({
      ok: false,
      reason: "delivery_failed",
    })
  })
})

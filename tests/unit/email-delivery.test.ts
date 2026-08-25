import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import {
  emailSenderLabel,
  emailStatusLabel,
  emailTriggerCatalog,
} from "@/lib/email-delivery"
import { renderPlexusEmail } from "@/lib/email-delivery-service"

describe("email delivery contracts", () => {
  it("keeps one unique coverage definition for every supported trigger", () => {
    const keys = emailTriggerCatalog.map((trigger) => trigger.key)

    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual(
      expect.arrayContaining([
        "password_reset",
        "vendor_setup",
        "information_blast",
        "scheduled_reminder",
      ])
    )
  })

  it("distinguishes Supabase Auth delivery ownership from Resend API sends", () => {
    const forgotPassword = emailTriggerCatalog.find(
      (trigger) => trigger.key === "password_reset"
    )
    const informationBlast = emailTriggerCatalog.find(
      (trigger) => trigger.key === "information_blast"
    )

    expect(forgotPassword?.provider).toContain("Supabase Auth")
    expect(informationBlast?.provider).toBe("Resend API")
  })

  it("escapes user-controlled email content before rendering HTML", () => {
    const html = renderPlexusEmail({
      title: "Update <script>",
      message: 'Hello <img src=x onerror="alert(1)"> & goodbye',
    })

    expect(html).toContain("Update &lt;script&gt;")
    expect(html).toContain("&lt;img")
    expect(html).not.toContain("<script>")
    expect(html).not.toContain("<img src=x")
  })

  it("provides reader-facing sender and status labels", () => {
    expect(emailSenderLabel("plexus_system")).toBe("Plexus system")
    expect(emailStatusLabel("delivery_delayed")).toBe("Delivery delayed")
  })
})

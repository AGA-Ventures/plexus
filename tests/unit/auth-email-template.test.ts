import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

const configPath = fileURLToPath(
  new URL("../../supabase/config.toml", import.meta.url)
)
const templatePath = fileURLToPath(
  new URL("../../supabase/templates/recovery.html", import.meta.url)
)

const config = readFileSync(configPath, "utf8")
const template = readFileSync(templatePath, "utf8")

describe("Plexus password recovery email", () => {
  it("is configured as the local Supabase recovery template", () => {
    expect(config).toContain("[auth.email.template.recovery]")
    expect(config).toContain('subject = "Reset your Plexus password"')
    expect(config).toContain(
      'content_path = "./supabase/templates/recovery.html"'
    )
    expect(config).toContain('sender_name = "Plexus Security"')
  })

  it("uses a cross-device recovery token instead of a PKCE confirmation URL", () => {
    expect(template).not.toContain("{{ .ConfirmationURL }}")
    expect(template.match(/{{ \.RedirectTo }}/g)).toHaveLength(3)
    expect(template.match(/{{ \.TokenHash }}/g)).toHaveLength(3)
    expect(template.match(/type=recovery/g)).toHaveLength(3)
    expect(template).toContain("{{ .Email }}")
  })

  it("uses the approved Plexus identity and email-safe structure", () => {
    expect(template).toContain(
      "https://plexus-gules.vercel.app/plexus-brand-wordmark.png"
    )
    expect(template).toContain('alt="Plexus — Sharper connections"')
    expect(template).toContain('role="presentation"')
    expect(template).toContain("Reset my password")
    expect(template).not.toContain("Supabase Auth")
  })
})

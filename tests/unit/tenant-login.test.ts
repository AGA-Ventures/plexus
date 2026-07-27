import { describe, expect, it } from "vitest"

import {
  normalizeBrandColor,
  normalizeLogoUrl,
  normalizeTenantSlug,
  readableForeground,
  tenantSlugFromHostname,
} from "@/lib/tenant-login"

describe("tenant login branding", () => {
  it("accepts canonical tenant slugs and Plexus tenant hosts", () => {
    expect(normalizeTenantSlug("  Plexus-Managed ")).toBe("plexus-managed")
    expect(tenantSlugFromHostname("plexus-managed.plexus.com:443")).toBe(
      "plexus-managed"
    )
  })

  it("does not treat platform or unrelated hosts as tenant brands", () => {
    expect(tenantSlugFromHostname("plexus.com")).toBeUndefined()
    expect(tenantSlugFromHostname("www.plexus.com")).toBeUndefined()
    expect(tenantSlugFromHostname("tenant.example.com")).toBeUndefined()
    expect(normalizeTenantSlug("../tenant")).toBeUndefined()
  })

  it("accepts only safe logo locations", () => {
    expect(normalizeLogoUrl("/tenant/logo.png")).toBe("/tenant/logo.png")
    expect(normalizeLogoUrl("https://cdn.example.com/logo.png")).toBe(
      "https://cdn.example.com/logo.png"
    )
    expect(normalizeLogoUrl("http://example.com/logo.png")).toBeUndefined()
    expect(normalizeLogoUrl("javascript:alert(1)")).toBeUndefined()
  })

  it("normalizes colors and chooses a readable foreground", () => {
    expect(normalizeBrandColor("#16839A")).toBe("#16839a")
    expect(normalizeBrandColor("teal")).toBe("#6fdaea")
    expect(readableForeground("#6fdaea")).toBe("#21184a")
    expect(readableForeground("#24164d")).toBe("#ffffff")
  })
})

import { describe, expect, it } from "vitest"

import {
  detectTenantLogoMimeType,
  getOwnedTenantLogoStoragePath,
  getTenantLogoStoragePath,
} from "@/lib/tenant-logo-upload"

const tenantId = "7aa8562e-f281-4138-a830-3e6bcc57b0b9"

describe("tenant logo upload", () => {
  it("recognizes supported image signatures", () => {
    expect(
      detectTenantLogoMimeType(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      )
    ).toBe("image/png")
    expect(
      detectTenantLogoMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))
    ).toBe("image/jpeg")
    expect(
      detectTenantLogoMimeType(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ])
      )
    ).toBe("image/webp")
  })

  it("rejects unsupported or spoofed payloads", () => {
    expect(
      detectTenantLogoMimeType(
        new TextEncoder().encode("<svg onload=alert(1)>")
      )
    ).toBeUndefined()
    expect(
      detectTenantLogoMimeType(new TextEncoder().encode("not an image"))
    ).toBeUndefined()
  })

  it("creates tenant-scoped storage paths", () => {
    expect(
      getTenantLogoStoragePath({
        tenantId,
        mimeType: "image/webp",
        objectId: "brand-asset",
      })
    ).toBe(`${tenantId}/login-logo-brand-asset.webp`)
  })

  it("only identifies owned objects from the branding bucket", () => {
    const path = `${tenantId}/login-logo-brand-asset.png`
    const publicUrl =
      `https://example.supabase.co/storage/v1/object/public/` +
      `tenant-branding/${path}`

    expect(getOwnedTenantLogoStoragePath(publicUrl, tenantId)).toBe(path)
    expect(
      getOwnedTenantLogoStoragePath(publicUrl, crypto.randomUUID())
    ).toBeUndefined()
    expect(
      getOwnedTenantLogoStoragePath(
        `https://example.supabase.co/storage/v1/object/public/other/${path}`,
        tenantId
      )
    ).toBeUndefined()
    expect(
      getOwnedTenantLogoStoragePath("javascript:alert(1)", tenantId)
    ).toBeUndefined()
  })
})

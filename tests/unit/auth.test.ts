import { describe, expect, it } from "vitest"

import { getAppMetadata, getRolePortalPath, isAppRole } from "@/lib/auth"

describe("isAppRole", () => {
  it("accepts the three launch roles", () => {
    expect(isAppRole("admin")).toBe(true)
    expect(isAppRole("delegation")).toBe(true)
    expect(isAppRole("partner")).toBe(true)
  })

  it("rejects unknown or malformed values", () => {
    expect(isAppRole("superuser")).toBe(false)
    expect(isAppRole(undefined)).toBe(false)
    expect(isAppRole(42)).toBe(false)
  })
})

describe("getAppMetadata", () => {
  it("extracts a valid role and company ids", () => {
    const metadata = getAppMetadata({
      app_metadata: {
        role: "delegation",
        delegation_company_id: "00000000-0000-4000-8000-000000000001",
      },
    })
    expect(metadata.role).toBe("delegation")
    expect(metadata.delegation_company_id).toBe("00000000-0000-4000-8000-000000000001")
    expect(metadata.partner_company_id).toBeUndefined()
  })

  it("drops an invalid role", () => {
    expect(getAppMetadata({ app_metadata: { role: "hacker" } }).role).toBeUndefined()
  })

  it("handles a missing user safely", () => {
    expect(getAppMetadata(null).role).toBeUndefined()
    expect(getAppMetadata(undefined).role).toBeUndefined()
  })
})

describe("getRolePortalPath", () => {
  it("routes a role to its localized portal", () => {
    expect(getRolePortalPath("en", "admin")).toBe("/en/admin")
    expect(getRolePortalPath("zh", "partner")).toBe("/zh/partner")
  })

  it("falls back to login when role is missing", () => {
    expect(getRolePortalPath("en", undefined)).toBe("/en/login")
  })
})

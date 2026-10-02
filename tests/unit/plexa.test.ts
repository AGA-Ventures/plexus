import { describe, expect, it } from "vitest"

import { canRoleAccessPlexa, normalizePlexaRoleAccess } from "@/lib/plexa"

describe("PLEXA role access", () => {
  it("fails closed for missing and malformed settings", () => {
    expect(normalizePlexaRoleAccess(undefined)).toEqual({
      admin: false,
      vendor: false,
    })
    expect(normalizePlexaRoleAccess("enabled")).toEqual({
      admin: false,
      vendor: false,
    })
    expect(normalizePlexaRoleAccess({ admin: "true", vendor: 1 })).toEqual({
      admin: false,
      vendor: false,
    })
  })

  it("normalizes each role toggle independently", () => {
    expect(normalizePlexaRoleAccess({ admin: true, vendor: false })).toEqual({
      admin: true,
      vendor: false,
    })
  })

  it("always permits Superadmin and follows configured role access", () => {
    const setting = { admin: true, vendor: false }

    expect(canRoleAccessPlexa("superadmin", setting)).toBe(true)
    expect(canRoleAccessPlexa("admin", setting)).toBe(true)
    expect(canRoleAccessPlexa("vendor", setting)).toBe(false)
  })
})

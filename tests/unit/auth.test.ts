import { describe, expect, it } from "vitest"

import {
  getAppMetadata,
  getRoleBindingError,
  getRolePortalPath,
  hasValidRoleBinding,
  isAppRole,
} from "@/lib/auth"

const adminId = "00000000-0000-4000-8000-000000000001"
const vendorCompanyId = "00000000-0000-4000-8000-000000000002"

describe("isAppRole", () => {
  it("accepts the three canonical portal roles", () => {
    expect(isAppRole("superadmin")).toBe(true)
    expect(isAppRole("admin")).toBe(true)
    expect(isAppRole("vendor")).toBe(true)
  })

  it("rejects legacy, unknown, or malformed values", () => {
    expect(isAppRole("delegation")).toBe(false)
    expect(isAppRole("partner")).toBe(false)
    expect(isAppRole("superuser")).toBe(false)
    expect(isAppRole(undefined)).toBe(false)
    expect(isAppRole(42)).toBe(false)
  })
})

describe("getAppMetadata", () => {
  it("extracts valid vendor tenant bindings", () => {
    const metadata = getAppMetadata({
      app_metadata: {
        role: "vendor",
        admin_id: adminId,
        vendor_company_id: vendorCompanyId,
        vendor_type: "delegation",
      },
    })

    expect(metadata).toEqual({
      role: "vendor",
      admin_id: adminId,
      vendor_company_id: vendorCompanyId,
      vendor_type: "delegation",
    })
  })

  it("drops invalid roles and malformed bindings", () => {
    const metadata = getAppMetadata({
      app_metadata: {
        role: "hacker",
        admin_id: "not-a-uuid",
        vendor_type: "reseller",
      },
    })

    expect(metadata.role).toBeUndefined()
    expect(metadata.admin_id).toBeUndefined()
    expect(metadata.vendor_type).toBeUndefined()
  })

  it("handles a missing user safely", () => {
    expect(getAppMetadata(null).role).toBeUndefined()
    expect(getAppMetadata(undefined).role).toBeUndefined()
  })
})

describe("role bindings", () => {
  it("requires all tenant and company bindings for vendors", () => {
    const metadata = getAppMetadata({
      app_metadata: { role: "vendor", admin_id: adminId },
    })

    expect(hasValidRoleBinding(metadata)).toBe(false)
    expect(getRoleBindingError(metadata)).toContain("vendor_company_id")
  })

  it("requires an admin tenant binding", () => {
    const metadata = getAppMetadata({ app_metadata: { role: "admin" } })

    expect(hasValidRoleBinding(metadata)).toBe(false)
    expect(getRoleBindingError(metadata)).toContain("admin_id")
  })

  it("accepts a bound admin and an unbound superadmin", () => {
    expect(
      hasValidRoleBinding(
        getAppMetadata({ app_metadata: { role: "admin", admin_id: adminId } })
      )
    ).toBe(true)
    expect(
      hasValidRoleBinding(getAppMetadata({ app_metadata: { role: "superadmin" } }))
    ).toBe(true)
  })

  it("rejects unexpected superadmin tenant bindings", () => {
    const metadata = getAppMetadata({
      app_metadata: { role: "superadmin", admin_id: adminId },
    })

    expect(hasValidRoleBinding(metadata)).toBe(false)
  })
})

describe("getRolePortalPath", () => {
  it("routes a role to its localized portal", () => {
    expect(getRolePortalPath("en", "superadmin")).toBe("/en/superadmin")
    expect(getRolePortalPath("zh", "admin")).toBe("/zh/admin")
    expect(getRolePortalPath("en", "vendor")).toBe("/en/vendor")
  })

  it("falls back to login when role is missing", () => {
    expect(getRolePortalPath("en", undefined)).toBe("/en/login")
  })
})

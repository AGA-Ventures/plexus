import { describe, expect, it } from "vitest"

import {
  buildSuperadminVendorDemoRecords,
  isSuperadminDemoVendor,
  SUPERADMIN_VENDOR_DEMO_TARGET,
} from "@/lib/superadmin-demo-data"
import type { AdminTenant } from "@/lib/management-data"

const tenants = [
  {
    id: "tenant-a",
    name: "Tenant A",
  },
  {
    id: "tenant-b",
    name: "Tenant B",
  },
] as AdminTenant[]

describe("Superadmin Vendor demo data", () => {
  it("fills the directory to the configured scale target", () => {
    const records = buildSuperadminVendorDemoRecords(tenants, 17)

    expect(records).toHaveLength(SUPERADMIN_VENDOR_DEMO_TARGET - 17)
    expect(new Set(records.map((record) => record.id)).size).toBe(
      records.length
    )
    expect(new Set(records.map((record) => record.admin_id))).toEqual(
      new Set(["tenant-a", "tenant-b"])
    )
  })

  it("creates clearly identifiable, non-production records", () => {
    const [record] = buildSuperadminVendorDemoRecords(tenants, 239)

    expect(isSuperadminDemoVendor(record)).toBe(true)
    expect(record.contact_meta).toMatch(/@example\.invalid$/)
    expect(record.profile_complete).toBeGreaterThanOrEqual(55)
    expect(record.profile_complete).toBeLessThanOrEqual(100)
  })

  it("does not generate records without a tenant or above the target", () => {
    expect(buildSuperadminVendorDemoRecords([], 0)).toEqual([])
    expect(
      buildSuperadminVendorDemoRecords(tenants, SUPERADMIN_VENDOR_DEMO_TARGET)
    ).toEqual([])
  })
})

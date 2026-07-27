import { describe, expect, it } from "vitest"

import { isActiveAdminRecoveryAccount } from "@/lib/admin-password-recovery"

describe("Admin password recovery eligibility", () => {
  it("allows only active, tenant-bound Admin accounts with an email", () => {
    expect(
      isActiveAdminRecoveryAccount({
        role: "admin",
        admin_id: "tenant-1",
        active: true,
        email: "admin@example.com",
      })
    ).toBe(true)

    expect(
      isActiveAdminRecoveryAccount({
        role: "admin",
        admin_id: "tenant-1",
        active: false,
        email: "admin@example.com",
      })
    ).toBe(false)

    expect(
      isActiveAdminRecoveryAccount({
        role: "vendor",
        admin_id: "tenant-1",
        active: true,
        email: "vendor@example.com",
      })
    ).toBe(false)

    expect(
      isActiveAdminRecoveryAccount({
        role: "admin",
        admin_id: null,
        active: true,
        email: "admin@example.com",
      })
    ).toBe(false)
  })
})

import type { SupabaseClient, User } from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { validateAuthenticatedUser } from "@/lib/authorization"
import { defaultMeetingAvailability } from "@/lib/meeting-availability"

const adminId = "00000000-0000-4000-8000-000000000001"
const vendorCompanyId = "00000000-0000-4000-8000-000000000002"
const userId = "00000000-0000-4000-8000-000000000003"

function createVendorUser(): User {
  return {
    id: userId,
    email: "vendor@example.com",
    app_metadata: {
      role: "vendor",
      admin_id: adminId,
      vendor_company_id: vendorCompanyId,
      vendor_type: "delegation",
    },
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-07-28T00:00:00.000Z",
  } as User
}

function createSupabaseMock(vendorDiscoveryEnabled = true) {
  const rows = {
    user_profiles: {
      data: {
        id: userId,
        role: "vendor",
        display_name: "Vendor User",
        email: "vendor@example.com",
        admin_id: adminId,
        vendor_company_id: vendorCompanyId,
        vendor_type: "delegation",
        active: true,
      },
      error: null,
    },
    vendor_companies: {
      data: {
        id: vendorCompanyId,
        admin_id: adminId,
        vendor_type: "delegation",
        status: "active",
      },
      error: null,
    },
    admin_tenants: {
      data: {
        id: adminId,
        status: "active",
        name: "AGA Ventures",
        support_email: "support@aga.example",
        primary_color: "#0082a3",
        logo_url: "https://cdn.example.com/aga-logo.png",
        vendor_discovery_enabled: vendorDiscoveryEnabled,
        meeting_availability: defaultMeetingAvailability,
      },
      error: null,
    },
  }
  const queriedTables: string[] = []

  const supabase = {
    from(table: keyof typeof rows) {
      queriedTables.push(table)
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        maybeSingle: vi.fn(async () => rows[table]),
      }
      return builder
    },
  } as unknown as SupabaseClient

  return { supabase, queriedTables }
}

describe("validateAuthenticatedUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads the owning Admin tenant white label for a valid Vendor", async () => {
    const { supabase, queriedTables } = createSupabaseMock()

    const result = await validateAuthenticatedUser(supabase, createVendorUser())

    expect(result).toEqual({
      ok: true,
      identity: {
        userId,
        email: "vendor@example.com",
        displayName: "Vendor User",
        role: "vendor",
        adminId,
        vendorCompanyId,
        vendorType: "delegation",
        tenantName: "AGA Ventures",
        tenantSupportEmail: "support@aga.example",
        tenantPrimaryColor: "#0082a3",
        tenantLogoUrl: "https://cdn.example.com/aga-logo.png",
        tenantVendorDiscoveryEnabled: true,
        tenantMeetingAvailability: defaultMeetingAvailability,
      },
    })
    expect(queriedTables).toEqual([
      "user_profiles",
      "vendor_companies",
      "admin_tenants",
    ])
  })

  it("loads a disabled Vendor discovery capability from the owning tenant", async () => {
    const { supabase } = createSupabaseMock(false)

    const result = await validateAuthenticatedUser(supabase, createVendorUser())

    expect(result).toMatchObject({
      ok: true,
      identity: {
        tenantVendorDiscoveryEnabled: false,
      },
    })
  })
})

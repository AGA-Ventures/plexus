import { beforeEach, describe, expect, it, vi } from "vitest"

import { createBlankCompanyRegistrationProfile } from "@/lib/company-profile"
import type { CompanyRegistrationProfile } from "@/lib/local-db"

const mocks = vi.hoisted(() => ({
  getTenant: vi.fn(),
  insert: vi.fn(),
}))

vi.mock("@/lib/vendor-application-server", () => ({
  getActiveVendorApplicationTenant: mocks.getTenant,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({
      insert: mocks.insert,
    }),
  }),
}))

import { POST } from "@/app/api/vendor-applications/route"

function completeProfile(overrides: Partial<CompanyRegistrationProfile> = {}) {
  return {
    ...createBlankCompanyRegistrationProfile(),
    companyNameEn: "Route Test Vendor",
    countryRegion: "Malaysia",
    yearEstablished: "2020",
    registrationNumber: "ROUTE-001",
    website: "https://route-test.example",
    address: "1 Route Test Street",
    employeeRange: "1-10",
    contactName: "Route Tester",
    contactPosition: "Director",
    contactEmail: "route@test.example",
    mobileNumber: "+60 12 345 6789",
    preferredLanguages: ["English"],
    industries: ["Manufacture of food products"],
    introduction: Array.from({ length: 100 }, () => "company").join(" "),
    productsServices: "Products and services",
    offers: ["Manufacturer"],
    lookingFor: ["Distributors"],
    preferredPartnerTypes: ["Distributor"],
    expectedOutcomes: ["Distribution Agreement"],
    idealPartner: "A regional distributor.",
    opportunity: "A distribution partnership.",
    exportsInternationally: "No",
    meetingFormat: "Either",
    availableMeetingDates: "August 2026, MYT",
    maxMeetings: "5",
    consent: true,
    consentName: "Route Tester",
    consentDate: "2026-07-29",
    ...overrides,
  } satisfies CompanyRegistrationProfile
}

function applicationRequest(body: unknown, headers?: HeadersInit) {
  return new Request("https://plexus.example/api/vendor-applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

describe("POST /api/vendor-applications", () => {
  beforeEach(() => {
    mocks.getTenant.mockReset()
    mocks.insert.mockReset()
    mocks.getTenant.mockResolvedValue({
      id: "82000000-0000-4000-8000-000000000001",
    })
    mocks.insert.mockResolvedValue({ error: null })
  })

  it("rejects malformed and oversized requests before database access", async () => {
    const malformed = await POST(applicationRequest("{"))
    const oversized = await POST(
      applicationRequest("{}", { "content-length": String(64 * 1024 + 1) })
    )

    expect(malformed.status).toBe(400)
    expect(oversized.status).toBe(413)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("returns field-level errors for incomplete profiles", async () => {
    const response = await POST(
      applicationRequest({
        tenantSlug: "tenant-one",
        vendorType: "delegation",
        profile: createBlankCompanyRegistrationProfile(),
      })
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.fieldErrors.companyNameEn).toBeTruthy()
    expect(payload.fieldErrors.contactEmail).toBeTruthy()
  })

  it("does not store honeypot submissions", async () => {
    const response = await POST(
      applicationRequest({
        tenantSlug: "tenant-one",
        vendorType: "delegation",
        profile: completeProfile(),
        websiteConfirm: "https://bot.example",
      })
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, submitted: true })
    expect(mocks.getTenant).not.toHaveBeenCalled()
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("rejects unknown or inactive tenant links", async () => {
    mocks.getTenant.mockResolvedValue(null)

    const response = await POST(
      applicationRequest({
        tenantSlug: "suspended-tenant",
        vendorType: "partner",
        profile: completeProfile(),
      })
    )

    expect(response.status).toBe(404)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it("uses the server-resolved tenant and normalizes the login email", async () => {
    const profile = completeProfile({
      contactEmail: "Owner@Vendor.Example",
    })
    const response = await POST(
      applicationRequest({
        tenantSlug: "tenant-one",
        vendorType: "partner",
        profile,
      })
    )

    expect(response.status).toBe(200)
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: "82000000-0000-4000-8000-000000000001",
        vendor_type: "partner",
        normalized_email: "owner@vendor.example",
        profile_complete: 100,
      })
    )
    expect(mocks.insert.mock.calls[0]?.[0]).not.toHaveProperty("admin_id", null)
  })

  it("returns the same success response for new and duplicate valid submissions", async () => {
    const body = {
      tenantSlug: "tenant-one",
      vendorType: "delegation",
      profile: completeProfile(),
    }
    const created = await POST(applicationRequest(body))
    mocks.insert.mockResolvedValueOnce({
      error: { code: "23505" },
    })
    const duplicate = await POST(applicationRequest(body))

    expect(await created.json()).toEqual({ ok: true, submitted: true })
    expect(await duplicate.json()).toEqual({ ok: true, submitted: true })
  })
})

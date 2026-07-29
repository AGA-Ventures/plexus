import { describe, expect, it } from "vitest"

import { createBlankCompanyRegistrationProfile } from "@/lib/company-profile"
import {
  buildApprovedCompanyInsert,
  buildCompanyProfilePersistence,
} from "@/lib/company-profile-persistence"

function completeProfile() {
  return {
    ...createBlankCompanyRegistrationProfile(),
    companyNameEn: "Persistence Vendor",
    companyNameCn: "持久供应商",
    countryRegion: "Malaysia",
    yearEstablished: "2020",
    registrationNumber: "PERSIST-001",
    website: "https://persistence.example",
    address: "1 Persistence Street",
    employeeRange: "11-50",
    contactName: "Profile Owner",
    contactPosition: "Director",
    contactEmail: "owner@persistence.example",
    mobileNumber: "+60 12 345 6789",
    preferredLanguages: ["English"],
    industries: ["Manufacture of food products"],
    introduction: Array.from({ length: 100 }, () => "company").join(" "),
    productsServices: "Food manufacturing",
    offers: ["Manufacturer"],
    lookingFor: ["Distributors"],
    preferredPartnerTypes: ["Distributor"],
    expectedOutcomes: ["Distribution Agreement"],
    idealPartner: "A distributor",
    opportunity: "Regional distribution",
    exportsInternationally: "No",
    meetingFormat: "Either",
    availableMeetingDates: "August 2026",
    maxMeetings: "5",
    consent: true,
    consentName: "Profile Owner",
    consentDate: "2026-07-29",
  }
}

describe("company profile persistence mapping", () => {
  it("uses the Delegation profile-save mapping for approved applications", () => {
    const profile = completeProfile()
    const update = buildCompanyProfilePersistence("delegation", profile)
    const insert = buildApprovedCompanyInsert({
      adminId: "admin-id",
      vendorId: "vendor-id",
      vendorType: "delegation",
      profile,
    })

    expect(update.kind).toBe("delegation")
    expect(insert.table).toBe("delegation_companies")
    expect(insert.values).toEqual(
      expect.objectContaining({
        ...update.values,
        id: "vendor-id",
        admin_id: "admin-id",
        vendor_company_id: "vendor-id",
        vendor_type: "delegation",
        coordinator: "Profile Owner",
        profile_complete: 100,
        status: "Locked",
        urgent: false,
      })
    )
  })

  it("uses the Partner verification mapping and initial invitation status", () => {
    const profile = completeProfile()
    const update = buildCompanyProfilePersistence("partner", profile)
    const insert = buildApprovedCompanyInsert({
      adminId: "admin-id",
      vendorId: "vendor-id",
      vendorType: "partner",
      profile,
    })

    expect(update.kind).toBe("partner")
    expect(insert.table).toBe("partner_companies")
    expect(insert.values).toEqual(
      expect.objectContaining({
        ...update.values,
        id: "vendor-id",
        admin_id: "admin-id",
        vendor_company_id: "vendor-id",
        vendor_type: "partner",
        partner_type: "Enterprise",
        status: "Invited",
        attendance: "Invited",
        arrived: false,
        profile_complete: 100,
        verified: "Verified",
      })
    )
  })
})

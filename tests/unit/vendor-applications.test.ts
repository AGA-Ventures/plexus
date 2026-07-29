import { describe, expect, it } from "vitest"

import type { CompanyRegistrationProfile } from "@/lib/local-db"
import {
  normalizeVendorApplicationEmail,
  vendorApplicationProfileSchema,
  vendorApplicationRequestSchema,
} from "@/lib/vendor-applications"

const introduction = Array.from(
  { length: 100 },
  (_, index) => `word${index + 1}`
).join(" ")

function createCompleteProfile(
  overrides: Partial<CompanyRegistrationProfile> = {}
): CompanyRegistrationProfile {
  return {
    companyNameEn: "Complete Vendor Sdn Bhd",
    companyNameCn: "",
    countryRegion: "Malaysia",
    countryOther: "",
    yearEstablished: "2020",
    registrationNumber: "202001234567",
    website: "https://vendor.example",
    address: "1 Example Street, Kuala Lumpur",
    employeeRange: "11-50",
    annualRevenueRange: "",
    contactName: "Amina Vendor",
    contactPosition: "Managing Director",
    contactEmail: "amina@vendor.example",
    mobileNumber: "+60 12 345 6789",
    chatId: "",
    preferredLanguages: ["English"],
    industries: ["Manufacture of food products"],
    industryOther: "",
    introduction,
    productsServices: "Shelf-stable food products and private-label services.",
    certifications: [],
    certificationOther: "",
    offers: ["Manufacturer"],
    offerOther: "",
    lookingFor: ["Distributors"],
    lookingForOther: "",
    preferredPartnerTypes: ["Distributor"],
    preferredPartnerOther: "",
    expectedOutcomes: ["Distribution Agreement"],
    idealPartner: "An established distributor with nationwide retail reach.",
    opportunity: "A regional distribution and private-label partnership.",
    exportsInternationally: "No",
    exportMarkets: "",
    meetingFormat: "Either",
    availableMeetingDates: "Weekdays in August 2026, MYT",
    maxMeetings: "5",
    supportingDocuments: [],
    consent: true,
    consentName: "Amina Vendor",
    consentDate: "2026-07-29",
    ...overrides,
  }
}

const requiredTextFields = [
  "countryRegion",
  "companyNameEn",
  "yearEstablished",
  "registrationNumber",
  "website",
  "address",
  "employeeRange",
  "contactName",
  "contactPosition",
  "contactEmail",
  "mobileNumber",
  "introduction",
  "productsServices",
  "idealPartner",
  "opportunity",
  "exportsInternationally",
  "meetingFormat",
  "availableMeetingDates",
  "maxMeetings",
  "consentName",
  "consentDate",
] as const

const requiredListFields = [
  "preferredLanguages",
  "industries",
  "offers",
  "lookingFor",
  "preferredPartnerTypes",
  "expectedOutcomes",
] as const

describe("Vendor application contract", () => {
  it("accepts a complete 28-item core profile and preserves optional fields", () => {
    const profile = createCompleteProfile({
      companyNameCn: "完整供应商",
      annualRevenueRange: "USD 1M-10M",
      chatId: "amina-vendor",
      certifications: ["Halal"],
      certificationOther: "MyGAP",
      supportingDocuments: ["Company Profile", "Business License"],
    })
    const result = vendorApplicationProfileSchema.safeParse(profile)

    expect(result.success).toBe(true)
    expect(result.success && result.data).toEqual(profile)
  })

  for (const field of requiredTextFields) {
    it(`requires the core field ${field}`, () => {
      const result = vendorApplicationProfileSchema.safeParse(
        createCompleteProfile({ [field]: "" })
      )

      expect(result.success).toBe(false)
      expect(
        !result.success &&
          result.error.issues.some((issue) => issue.path[0] === field)
      ).toBe(true)
    })
  }

  for (const field of requiredListFields) {
    it(`requires at least one value for ${field}`, () => {
      const result = vendorApplicationProfileSchema.safeParse(
        createCompleteProfile({ [field]: [] })
      )

      expect(result.success).toBe(false)
      expect(
        !result.success &&
          result.error.issues.some((issue) => issue.path[0] === field)
      ).toBe(true)
    })
  }

  it("requires consent", () => {
    const result = vendorApplicationProfileSchema.safeParse(
      createCompleteProfile({ consent: false })
    )

    expect(result.success).toBe(false)
    expect(
      !result.success &&
        result.error.issues.some((issue) => issue.path[0] === "consent")
    ).toBe(true)
  })

  it("enforces conditional country and export fields", () => {
    const result = vendorApplicationProfileSchema.safeParse(
      createCompleteProfile({
        countryRegion: "Other",
        countryOther: "",
        exportsInternationally: "Yes",
        exportMarkets: "",
      })
    )

    expect(result.success).toBe(false)
    expect(
      !result.success && result.error.issues.map((issue) => issue.path[0])
    ).toEqual(expect.arrayContaining(["countryOther", "exportMarkets"]))
  })

  it("enforces boundary validation inherited from the company profile", () => {
    expect(
      vendorApplicationProfileSchema.safeParse(
        createCompleteProfile({ introduction: "too short" })
      ).success
    ).toBe(false)
    expect(
      vendorApplicationProfileSchema.safeParse(
        createCompleteProfile({ website: "vendor.example" })
      ).success
    ).toBe(false)
    expect(
      vendorApplicationProfileSchema.safeParse(
        createCompleteProfile({ consentDate: "2099-01-01" })
      ).success
    ).toBe(false)
  })

  it("locks subtype to the supported link values and rejects admin bindings", () => {
    const profile = createCompleteProfile()

    expect(
      vendorApplicationRequestSchema.safeParse({
        tenantSlug: "tenant-one",
        vendorType: "delegate",
        profile,
      }).success
    ).toBe(false)
    expect(
      vendorApplicationRequestSchema.safeParse({
        tenantSlug: "tenant-one",
        vendorType: "delegation",
        admin_id: crypto.randomUUID(),
        profile,
      }).success
    ).toBe(false)
  })

  it("normalizes the account email before duplicate enforcement", () => {
    expect(normalizeVendorApplicationEmail("  Owner@Vendor.Example ")).toBe(
      "owner@vendor.example"
    )
  })
})

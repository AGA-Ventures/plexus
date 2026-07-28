import { describe, expect, it } from "vitest"

import {
  getCompanyProfileCompletion,
  getCompanyProfileSectionCompletion,
  validateCompanyRegistrationProfile,
} from "@/lib/company-profile"
import type { CompanyRegistrationProfile } from "@/lib/local-db"

function createProfile(
  overrides: Partial<CompanyRegistrationProfile> = {}
): CompanyRegistrationProfile {
  return {
    companyNameEn: "ABC Sdn Bhd",
    companyNameCn: "",
    countryRegion: "",
    countryOther: "",
    yearEstablished: "",
    registrationNumber: "",
    website: "",
    address: "",
    employeeRange: "",
    annualRevenueRange: "",
    contactName: "",
    contactPosition: "",
    contactEmail: "",
    mobileNumber: "",
    chatId: "",
    preferredLanguages: [],
    industries: [],
    industryOther: "",
    introduction: "",
    productsServices: "",
    certifications: [],
    certificationOther: "",
    offers: [],
    offerOther: "",
    lookingFor: [],
    lookingForOther: "",
    preferredPartnerTypes: [],
    preferredPartnerOther: "",
    expectedOutcomes: [],
    idealPartner: "",
    opportunity: "",
    exportsInternationally: "",
    exportMarkets: "",
    meetingFormat: "",
    availableMeetingDates: "",
    maxMeetings: "",
    supportingDocuments: [],
    consent: false,
    consentName: "",
    consentDate: "",
    ...overrides,
  }
}

describe("company profile validation", () => {
  it("accepts empty optional fields and valid typed values", () => {
    const errors = validateCompanyRegistrationProfile(
      createProfile({
        yearEstablished: "2018",
        website: "https://example.com",
        contactEmail: "name@example.com",
        mobileNumber: "+60 12 345 6789",
        consentDate: "2026-07-28",
      })
    )

    expect(errors).toEqual({})
  })

  it("returns field-specific errors for typed inputs", () => {
    const errors = validateCompanyRegistrationProfile(
      createProfile({
        yearEstablished: "20A8",
        website: "example",
        contactEmail: "not-an-email",
        mobileNumber: "call me",
        consentDate: "2026-02-30",
        introduction: "Too short",
      })
    )

    expect(errors.yearEstablished).toContain("four-digit year")
    expect(errors.website).toContain("complete URL")
    expect(errors.contactEmail).toContain("valid email")
    expect(errors.mobileNumber).toContain("valid phone")
    expect(errors.consentDate).toContain("valid date")
    expect(errors.introduction).toContain("100 to 200 words")
  })

  it("validates fields that depend on another answer", () => {
    const errors = validateCompanyRegistrationProfile(
      createProfile({
        countryRegion: "Other",
        exportsInternationally: "Yes",
        consent: true,
      })
    )

    expect(errors.countryOther).toBeTruthy()
    expect(errors.exportMarkets).toBeTruthy()
    expect(errors.consentName).toBeTruthy()
    expect(errors.consentDate).toBeTruthy()
  })

  it("does not count invalid typed values toward completion", () => {
    const valid = getCompanyProfileCompletion(
      createProfile({ contactEmail: "name@example.com" })
    )
    const invalid = getCompanyProfileCompletion(
      createProfile({ contactEmail: "not-an-email" })
    )

    expect(valid.completed).toBe(invalid.completed + 1)
    expect(valid.total).toBe(28)
  })

  it("reports validated answered/total progress for every profile section", () => {
    const progress = getCompanyProfileSectionCompletion(
      createProfile({ companyNameEn: "" })
    )

    expect(progress).toEqual({
      company: { completed: 0, total: 7 },
      contact: { completed: 0, total: 5 },
      industry: { completed: 0, total: 1 },
      profile: { completed: 0, total: 2 },
      offer: { completed: 0, total: 1 },
      "looking-for": { completed: 0, total: 1 },
      preferences: { completed: 0, total: 2 },
      needs: { completed: 0, total: 2 },
      export: { completed: 0, total: 1 },
      meeting: { completed: 0, total: 3 },
      documents: { completed: 0, total: 1 },
      consent: { completed: 0, total: 3 },
    })
  })

  it("keeps conditional section questions incomplete until dependencies are valid", () => {
    const incomplete = getCompanyProfileSectionCompletion(
      createProfile({
        countryRegion: "Other",
        exportsInternationally: "Yes",
        supportingDocuments: ["Company Profile"],
      })
    )
    const complete = getCompanyProfileSectionCompletion(
      createProfile({
        countryRegion: "Other",
        countryOther: "Timor-Leste",
        exportsInternationally: "Yes",
        exportMarkets: "Malaysia",
        supportingDocuments: ["Company Profile"],
      })
    )

    expect(incomplete.company).toEqual({ completed: 1, total: 7 })
    expect(incomplete.export).toEqual({ completed: 0, total: 1 })
    expect(incomplete.documents).toEqual({ completed: 1, total: 1 })
    expect(complete.company).toEqual({ completed: 2, total: 7 })
    expect(complete.export).toEqual({ completed: 1, total: 1 })
  })
})

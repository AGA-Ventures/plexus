import { describe, expect, it } from "vitest"

import {
  createTChinaReference,
  normalizeTChinaEmail,
  normalizeTChinaPhone,
  tchinaRegistrationRequestSchema,
} from "@/lib/tchina-expo"
import { getTChinaLocalPreviewEvent } from "@/lib/tchina-expo-preview"
import { composeInternationalPhoneNumber } from "@/lib/international-phone"

function shared() {
  return {
    locale: "en" as const,
    fullName: "Amina Tan",
    email: "amina@example.com",
    mobileNumber: "+60 12 345 6789",
    chatPlatform: "whatsapp" as const,
    chatId: "+60 12 345 6789",
    countryRegion: "Malaysia",
    preferredLanguage: "en" as const,
    attendanceDates: ["2026-08-31" as const],
    consent: true as const,
    websiteConfirm: "",
  }
}

function delegate() {
  return {
    ...shared(),
    attendeeType: "business_delegate" as const,
    delegate: {
      companyNameEn: "Amina Industries",
      companyNameZh: "",
      position: "Director",
      website: "https://amina.example",
      sectors: ["Manufacturing"],
      productsServices: "Precision components",
      offers: "OEM manufacturing",
      needs: "Regional distributors",
      desiredPartners: "Industrial buyers",
      desiredOutcomes: "Qualified partnerships",
      businessMatchingInterest: true,
    },
  }
}

function visitor() {
  return {
    ...shared(),
    attendeeType: "general_visitor" as const,
    visitor: {
      organization: "Example Association",
      position: "Member",
      industryInterests: ["Technology"],
      visitPurpose: "Explore suppliers and current market developments.",
    },
  }
}

describe("TChina Expo registration contract", () => {
  it("exposes the preview fixture only in local development", () => {
    expect(getTChinaLocalPreviewEvent("development")).toMatchObject({
      city: "Guangzhou",
    })
    expect(getTChinaLocalPreviewEvent("production")).toBeNull()
  })

  it("accepts the complete Business Delegate and General Visitor branches", () => {
    expect(tchinaRegistrationRequestSchema.safeParse(delegate()).success).toBe(
      true
    )
    expect(tchinaRegistrationRequestSchema.safeParse(visitor()).success).toBe(
      true
    )
  })

  it("accepts a number composed from a calling code and local entry", () => {
    const mobileNumber = composeInternationalPhoneNumber("US", "555 555 5555")
    const malaysianMobileNumber = composeInternationalPhoneNumber(
      "MY",
      "12 345 6789"
    )

    expect(mobileNumber).toBe("+1 555 555 5555")
    expect(malaysianMobileNumber).toBe("+60 12 345 6789")
    expect(
      tchinaRegistrationRequestSchema.safeParse({
        ...visitor(),
        mobileNumber,
      }).success
    ).toBe(true)
  })

  it("requires branch-specific fields and rejects branch mixing", () => {
    expect(
      tchinaRegistrationRequestSchema.safeParse({
        ...delegate(),
        delegate: { ...delegate().delegate, desiredPartners: "" },
      }).success
    ).toBe(false)
    expect(
      tchinaRegistrationRequestSchema.safeParse({
        ...visitor(),
        delegate: delegate().delegate,
      }).success
    ).toBe(false)
  })

  it("rejects unexpected authority and sensitive-document fields", () => {
    expect(
      tchinaRegistrationRequestSchema.safeParse({
        ...delegate(),
        tenantSlug: "tenant-one",
      }).success
    ).toBe(false)
    expect(
      tchinaRegistrationRequestSchema.safeParse({
        ...delegate(),
        admin_id: crypto.randomUUID(),
      }).success
    ).toBe(false)
    expect(
      tchinaRegistrationRequestSchema.safeParse({
        ...visitor(),
        passportNumber: "P1234567",
      }).success
    ).toBe(false)
  })

  it("restricts attendance to the five published event dates", () => {
    expect(
      tchinaRegistrationRequestSchema.safeParse({
        ...visitor(),
        attendanceDates: ["2026-09-05"],
      }).success
    ).toBe(false)
  })

  it("normalizes contact data and creates human-readable references", () => {
    expect(normalizeTChinaEmail(" Amina@Example.COM ")).toBe(
      "amina@example.com"
    )
    expect(normalizeTChinaPhone("+60 12-345 6789")).toBe("+60123456789")
    expect(createTChinaReference(new Date("2026-08-26T10:00:00Z"))).toMatch(
      /^TC26-20260826-[A-Z0-9]{6}$/
    )
  })
})

import { describe, expect, it } from "vitest"

import { publicPartnerRegistrationSchema } from "@/lib/public-partner-registration"

const validRegistration = {
  tenantSlug: "acme-malaysia",
  companyName: "Example Manufacturing Sdn Bhd",
  registrationNumber: "202601234567",
  website: "https://example.com",
  sector: "Manufacture of food products",
  introduction: Array.from(
    { length: 100 },
    (_, index) => `company${index + 1}`
  ).join(" "),
  productsServices:
    "We manufacture and distribute shelf-stable food products across Malaysia.",
  lookingFor:
    "We are seeking Macao distributors and strategic retail partners.",
  contactName: "Alex Tan",
  contactPosition: "Business Development Director",
  contactEmail: "alex@example.com",
  mobileNumber: "+60 12 345 6789",
}

describe("public Malaysian partner registration", () => {
  it("accepts the agreed 11-field light registration", () => {
    expect(publicPartnerRegistrationSchema.safeParse(validRegistration).success)
      .toBe(true)
  })

  it("requires a real sector and a 100 to 200 word profile", () => {
    const result = publicPartnerRegistrationSchema.safeParse({
      ...validRegistration,
      sector: "Pending",
      introduction: "Too short.",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.sector).toBeDefined()
      expect(result.error.flatten().fieldErrors.introduction).toBeDefined()
    }
  })

  it("rejects malformed tenant, website, email, and phone values", () => {
    const result = publicPartnerRegistrationSchema.safeParse({
      ...validRegistration,
      tenantSlug: "../another-tenant",
      website: "example dot com",
      contactEmail: "not-an-email",
      mobileNumber: "abc",
    })

    expect(result.success).toBe(false)
  })
})

import { describe, expect, it } from "vitest"

import {
  getPublicEnquiryFieldErrors,
  normalizePublicEnquiryEmail,
  publicEnquiryRequestSchema,
} from "@/lib/public-enquiry"

const validEnquiry = {
  name: "Aisha Lim",
  organisation: "Example Chamber",
  email: "aisha@example.com",
  phone: "",
  enquiryType: "pricing",
  message: "We would like a proposal for our 2027 trade program.",
  locale: "zh-Hans",
  sourcePage: "contact",
}

describe("public enquiry contract", () => {
  it("accepts the localized contact and pricing enquiry contract", () => {
    expect(publicEnquiryRequestSchema.parse(validEnquiry)).toMatchObject(
      validEnquiry
    )
  })

  it("rejects unexpected recipients and maps email failures to a safe field key", () => {
    const result = publicEnquiryRequestSchema.safeParse({
      ...validEnquiry,
      email: "invalid",
      recipient: "attacker@example.com",
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(getPublicEnquiryFieldErrors(result.error)).toMatchObject({
        email: "invalidEmail",
      })
    }
  })

  it("normalizes reply-to addresses before delivery", () => {
    expect(normalizePublicEnquiryEmail(" Aisha@Example.COM ")).toBe(
      "aisha@example.com"
    )
  })
})

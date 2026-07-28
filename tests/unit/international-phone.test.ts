import { describe, expect, it } from "vitest"

import {
  composeInternationalPhoneNumber,
  countryCallingCodeOptions,
  getCountryCodeForRegion,
  sanitizeNationalPhoneNumber,
  splitInternationalPhoneNumber,
} from "@/lib/international-phone"

describe("international phone helpers", () => {
  it("provides every supported country and region calling code", () => {
    expect(countryCallingCodeOptions.length).toBeGreaterThanOrEqual(240)
    expect(countryCallingCodeOptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          countryCode: "CN",
          callingCode: "86",
        }),
        expect.objectContaining({
          countryCode: "MO",
          callingCode: "853",
        }),
        expect.objectContaining({
          countryCode: "MY",
          callingCode: "60",
        }),
        expect.objectContaining({
          countryCode: "US",
          callingCode: "1",
        }),
      ])
    )
  })

  it("maps the registration profile region names to calling-code countries", () => {
    expect(getCountryCodeForRegion("Republic of Korea")).toBe("KR")
    expect(getCountryCodeForRegion("Chinese Taipei")).toBe("TW")
    expect(getCountryCodeForRegion("Macau")).toBe("MO")
    expect(getCountryCodeForRegion("")).toBe("MY")
  })

  it("splits existing international values without losing readable spacing", () => {
    expect(splitInternationalPhoneNumber("+60 12 345 6789", "MY")).toEqual({
      countryCode: "MY",
      callingCode: "60",
      nationalNumber: "12 345 6789",
    })
    expect(splitInternationalPhoneNumber("+853 6612 3456", "MO")).toEqual({
      countryCode: "MO",
      callingCode: "853",
      nationalNumber: "6612 3456",
    })
  })

  it("composes one backward-compatible international profile value", () => {
    expect(composeInternationalPhoneNumber("MO", "6612 3456")).toBe(
      "+853 6612 3456"
    )
    expect(composeInternationalPhoneNumber("MY", "")).toBe("")
    expect(sanitizeNationalPhoneNumber("12abc  345-6789")).toBe("12 345-6789")
  })
})

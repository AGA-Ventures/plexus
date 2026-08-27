import { describe, expect, it } from "vitest"

import {
  getPublicContent,
  normalizePublicLocale,
  publicLocales,
  withLocale,
} from "@/lib/public-site"

describe("public site locale routing", () => {
  it("keeps locale parameters before route fragments", () => {
    expect(withLocale("/pre-event#country-support", "ms")).toBe(
      "/pre-event?lang=ms#country-support"
    )
  })

  it("preserves existing query parameters", () => {
    expect(withLocale("/contact?source=footer", "zh-Hant")).toBe(
      "/contact?source=footer&lang=zh-Hant"
    )
  })

  it("normalizes public Malay and Traditional Chinese locale aliases", () => {
    expect(normalizePublicLocale("my")).toBe("ms")
    expect(normalizePublicLocale("zh")).toBe("zh-Hant")
    expect(normalizePublicLocale("unsupported")).toBe("en")
  })

  it("keeps pricing proposals scoped and actionable in every public locale", () => {
    for (const locale of publicLocales) {
      const pricing = getPublicContent(locale).pages.pricing

      expect(pricing.sectionTitle).toBeTruthy()
      expect(pricing.sectionBody).toBeTruthy()
      expect(pricing.points).toHaveLength(3)
      expect(pricing.points.every((point) => point.title && point.body)).toBe(
        true
      )
      expect(pricing.closing.title).toBeTruthy()
      expect(pricing.closing.body).toBeTruthy()
      expect(pricing.closing.cta).toBeTruthy()
      expect(pricing.closing.href).toBe("#enquiry")
      expect(
        getPublicContent(locale).enquiry.form.enquiryTypes.pricing
      ).toBeTruthy()
      expect(getPublicContent(locale).enquiry.whatsappMessage).toBeTruthy()
    }
  })

  it("keeps the public vision evidence-bound in every locale", () => {
    for (const locale of publicLocales) {
      const about = getPublicContent(locale).pages.about

      expect(about.sectionTitle).toBeTruthy()
      expect(about.sectionBody).toBeTruthy()
      expect(about.points).toHaveLength(5)
      expect(about.points.every((point) => point.title && point.body)).toBe(
        true
      )
      expect(about.closing.title).toBeTruthy()
      expect(about.closing.body).toBeTruthy()
      expect(about.closing.cta).toBeTruthy()
      expect(about.closing.href).toBe("/contact")
    }
  })
})

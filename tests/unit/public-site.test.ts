import { describe, expect, it } from "vitest"

import {
  getPublicContent,
  normalizePublicLocale,
  publicLocales,
  type PublicContent,
  withLocale,
} from "@/lib/public-site"

function expectTranslationContract(
  source: unknown,
  translation: unknown,
  path = "$"
) {
  expect(Array.isArray(translation), path).toBe(Array.isArray(source))

  if (Array.isArray(source)) {
    expect(translation, path).toHaveLength(source.length)
    source.forEach((item, index) =>
      expectTranslationContract(
        item,
        (translation as unknown[])[index],
        `${path}[${index}]`
      )
    )
    return
  }

  if (source && typeof source === "object") {
    const sourceRecord = source as Record<string, unknown>
    const translationRecord = translation as Record<string, unknown>
    expect(Object.keys(translationRecord).sort(), path).toEqual(
      Object.keys(sourceRecord).sort()
    )
    for (const key of Object.keys(sourceRecord)) {
      expectTranslationContract(
        sourceRecord[key],
        translationRecord[key],
        `${path}.${key}`
      )
    }
    return
  }

  expect(typeof translation, path).toBe(typeof source)
  if (typeof source === "string" && typeof translation === "string") {
    expect(translation.match(/\{[^}]+\}/g)?.sort() ?? [], path).toEqual(
      source.match(/\{[^}]+\}/g)?.sort() ?? []
    )
    if (path.endsWith(".href")) expect(translation, path).toBe(source)
  }
}

describe("public site locale routing", () => {
  it("exposes the intended public locales", () => {
    expect(publicLocales).toEqual(["en", "ms", "zh-Hans"])
  })

  it("keeps locale parameters before route fragments", () => {
    expect(withLocale("/pre-event#country-support", "ms")).toBe(
      "/pre-event?lang=ms#country-support"
    )
  })

  it("preserves existing query parameters", () => {
    expect(withLocale("/contact?source=footer", "zh-Hans")).toBe(
      "/contact?source=footer&lang=zh-Hans"
    )
  })

  it("normalizes public Malay and Simplified Chinese locale aliases", () => {
    expect(normalizePublicLocale("my")).toBe("ms")
    expect(normalizePublicLocale("zh")).toBe("zh-Hans")
    expect(normalizePublicLocale("zh-Hans")).toBe("zh-Hans")
    expect(normalizePublicLocale("zh-Hant")).toBe("zh-Hans")
    expect(normalizePublicLocale("unsupported")).toBe("en")
  })

  it("keeps localized dictionaries structurally faithful to English", () => {
    const english = getPublicContent("en") as PublicContent

    expectTranslationContract(english, getPublicContent("ms"))
    expectTranslationContract(english, getPublicContent("zh-Hans"))
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

import { describe, expect, it } from "vitest"

import {
  isLocaleParam,
  locales,
  normalizeLocale,
  protectedPortalLocales,
} from "@/lib/i18n"
import { supportedMarkets } from "@/lib/markets"

describe("i18n route coverage", () => {
  it("normalizes market locale aliases", () => {
    expect(normalizeLocale("cn")).toBe("zh")
    expect(normalizeLocale("zh-tw")).toBe("zh-Hant")
    expect(normalizeLocale("jp")).toBe("ja")
    expect(normalizeLocale("kr")).toBe("ko")
    expect(normalizeLocale("my")).toBe("ms")
    expect(normalizeLocale("vn")).toBe("vi")
    expect(normalizeLocale("mx")).toBe("es")
    expect(normalizeLocale("ca-fr")).toBe("fr")
  })

  it("accepts every public locale route", () => {
    expect(locales.every((locale) => isLocaleParam(locale))).toBe(true)
  })

  it("only offers fully translated locales inside protected portals", () => {
    expect(protectedPortalLocales).toEqual(["en", "zh", "zh-Hant", "th"])
  })

  it("keeps the provided market list routeable", () => {
    expect(supportedMarkets).toHaveLength(21)
    expect(
      supportedMarkets.every((market) => locales.includes(market.defaultLocale))
    ).toBe(true)
  })
})

import { describe, expect, it } from "vitest"

import {
  buildPreEventEmailHref,
  buildPreEventWhatsAppHref,
  getPreEventCountryOptions,
  preEventCampaignConfig,
} from "@/lib/pre-event"

describe("pre-event campaign helpers", () => {
  it("provides a localized worldwide country directory", () => {
    const englishCountries = getPreEventCountryOptions("en")
    const malayCountries = getPreEventCountryOptions("ms")
    const traditionalChineseCountries = getPreEventCountryOptions("zh-Hant")

    expect(englishCountries.length).toBeGreaterThanOrEqual(240)
    expect(englishCountries).toEqual(
      expect.arrayContaining([
        { countryCode: "MY", countryName: "Malaysia" },
        { countryCode: "MO", countryName: "Macao SAR China" },
        { countryCode: "CN", countryName: "China" },
        { countryCode: "US", countryName: "United States" },
      ])
    )
    expect(
      malayCountries.find(({ countryCode }) => countryCode === "MY")
    ).toEqual(expect.objectContaining({ countryName: "Malaysia" }))
    expect(
      traditionalChineseCountries.find(
        ({ countryCode }) => countryCode === "MO"
      )?.countryName
    ).not.toBe("MO")
  })

  it("builds an encoded WhatsApp draft for the selected country", () => {
    const href = buildPreEventWhatsAppHref({
      countryName: "Macao",
      messageTemplate:
        "Hello Plexus, I am travelling from {country} for an event.",
      whatsappNumber: "+60 12-267 7899",
    })
    const url = new URL(href!)

    expect(url.origin).toBe("https://wa.me")
    expect(url.pathname).toBe("/60122677899")
    expect(url.searchParams.get("text")).toBe(
      "Hello Plexus, I am travelling from Macao for an event."
    )
  })

  it("prepares email links without sending or persisting an inquiry", () => {
    const href = buildPreEventEmailHref({
      email: "support@example.com",
      subject: "Pre-event support inquiry",
      body: "Please contact me about an event.",
    })

    expect(href).toBe(
      "mailto:support@example.com?subject=Pre-event+support+inquiry&body=Please+contact+me+about+an+event."
    )
  })

  it("keeps unapproved campaign channels and co-branding disabled", () => {
    expect(preEventCampaignConfig.whatsappNumber).toBeNull()
    expect(preEventCampaignConfig.whatsappDisplay).toBeNull()
    expect(preEventCampaignConfig.email).toBeNull()
    expect(preEventCampaignConfig.coBrand).toBeNull()
    expect(preEventCampaignConfig.regionalChannels).toEqual([])
  })

  it("does not publish an unconfigured WhatsApp destination", () => {
    expect(
      buildPreEventWhatsAppHref({
        countryName: "Malaysia",
        messageTemplate: "Hello from {country}",
        whatsappNumber: null,
      })
    ).toBeNull()
  })
})

import { describe, expect, it } from "vitest"

import { withLocale } from "@/lib/public-site"

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
})

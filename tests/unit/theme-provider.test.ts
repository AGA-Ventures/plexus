import { describe, expect, it } from "vitest"

import { isThemeToggleKey } from "@/components/theme-provider"

describe("isThemeToggleKey", () => {
  it.each(["d", "D"])("accepts the %s key", (key) => {
    expect(isThemeToggleKey(key)).toBe(true)
  })

  it.each([undefined, null, "", "Dark", 100])(
    "ignores malformed or unrelated key values",
    (key) => {
      expect(isThemeToggleKey(key)).toBe(false)
    },
  )
})

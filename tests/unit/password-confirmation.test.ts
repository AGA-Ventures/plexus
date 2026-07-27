import { describe, expect, it } from "vitest"

import { hasMatchingPasswordConfirmation } from "@/lib/password-confirmation"

describe("password confirmation", () => {
  it("accepts two identical passwords at the minimum length", () => {
    expect(
      hasMatchingPasswordConfirmation("Temporary-12", "Temporary-12")
    ).toBe(true)
  })

  it("rejects different or incomplete values", () => {
    expect(
      hasMatchingPasswordConfirmation("Temporary-12", "Temporary-34")
    ).toBe(false)
    expect(hasMatchingPasswordConfirmation("short", "short")).toBe(false)
    expect(hasMatchingPasswordConfirmation("", "")).toBe(false)
  })
})

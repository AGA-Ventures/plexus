import { describe, expect, it } from "vitest"

import {
  getLoginProviderErrorCode,
  getLoginValidationErrorCode,
} from "@/lib/login-errors"

describe("login error codes", () => {
  it("maps provider details to stable, non-technical UI codes", () => {
    expect(getLoginProviderErrorCode("Invalid login credentials")).toBe(
      "invalid_credentials"
    )
    expect(getLoginProviderErrorCode("Email not confirmed")).toBe(
      "account_not_ready"
    )
    expect(getLoginProviderErrorCode("provider request id 123 failed")).toBe(
      "sign_in_failed"
    )
  })

  it("maps validation paths without returning schema messages", () => {
    expect(getLoginValidationErrorCode("email")).toBe("invalid_email")
    expect(getLoginValidationErrorCode("password")).toBe("password_required")
    expect(getLoginValidationErrorCode(undefined)).toBe("invalid_email")
  })
})

import { describe, expect, it } from "vitest"

import {
  getForgotPasswordPath,
  getLoginPath,
  getPasswordRecoveryFailurePath,
  getPasswordRecoveryRedirectUrl,
  parsePasswordResetPath,
  resolvePasswordRecoveryOrigin,
} from "@/lib/password-recovery"

describe("password recovery routes", () => {
  it("preserves valid tenant branding across recovery routes", () => {
    expect(getForgotPasswordPath("en", "shanghai-macau")).toBe(
      "/en/forgot-password?tenant=shanghai-macau"
    )
    expect(getLoginPath("en", "shanghai-macau", true)).toBe(
      "/en/login?tenant=shanghai-macau&passwordUpdated=1"
    )
  })

  it("builds an SSR callback URL for the password recovery session", () => {
    expect(
      getPasswordRecoveryRedirectUrl({
        origin: "https://plexus.example",
        locale: "en",
        tenantSlug: "shanghai-macau",
      })
    ).toBe(
      "https://plexus.example/auth/callback?next=%2Fen%2Freset-password%3Ftenant%3Dshanghai-macau"
    )
  })

  it("preserves a validated setup mode for approved Vendor onboarding", () => {
    const redirect = getPasswordRecoveryRedirectUrl({
      origin: "https://plexus.example",
      locale: "en",
      tenantSlug: "shanghai-macau",
      mode: "setup",
    })

    expect(redirect).toBe(
      "https://plexus.example/auth/callback?next=%2Fen%2Freset-password%3Ftenant%3Dshanghai-macau%26mode%3Dsetup"
    )
    expect(
      parsePasswordResetPath(
        "/en/reset-password?tenant=shanghai-macau&mode=setup"
      )
    ).toEqual({
      locale: "en",
      tenantSlug: "shanghai-macau",
      mode: "setup",
      path: "/en/reset-password?tenant=shanghai-macau&mode=setup",
    })
  })

  it("normalizes unknown password modes back to recovery", () => {
    expect(
      parsePasswordResetPath(
        "/en/reset-password?tenant=shanghai-macau&mode=admin"
      ).mode
    ).toBe("recovery")
  })

  it("uses the production origin ahead of the optional site URL", () => {
    expect(
      resolvePasswordRecoveryOrigin({
        productionUrl: "plexus.example",
        siteUrl: "http://localhost:3000",
      })
    ).toBe("https://plexus.example")
  })

  it("falls back safely when the configured site URL is invalid", () => {
    expect(
      resolvePasswordRecoveryOrigin({
        siteUrl: "javascript:alert(1)",
      })
    ).toBe("http://localhost:3000")
  })

  it("rejects external and unrelated callback destinations", () => {
    expect(parsePasswordResetPath("//evil.example/reset-password").path).toBe(
      "/en/reset-password"
    )
    expect(parsePasswordResetPath("/en/admin").path).toBe("/en/reset-password")
    expect(
      getPasswordRecoveryFailurePath("/en/reset-password?tenant=shanghai-macau")
    ).toBe("/en/forgot-password?tenant=shanghai-macau&error=invalid-link")
  })
})

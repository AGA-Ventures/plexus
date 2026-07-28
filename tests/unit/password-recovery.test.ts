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

  it("uses the production origin ahead of the optional site URL", () => {
    expect(
      resolvePasswordRecoveryOrigin({
        productionUrl: "plexus.example",
        siteUrl: "http://localhost:3000",
      })
    ).toBe("https://plexus.example")
  })

  it("uses the active loopback origin during local development", () => {
    expect(
      resolvePasswordRecoveryOrigin({
        environment: "development",
        productionUrl: "plexus.example",
        requestUrl: "http://localhost:3000/en/superadmin",
        siteUrl: "http://localhost:3001",
      })
    ).toBe("http://localhost:3000")
    expect(
      resolvePasswordRecoveryOrigin({
        environment: "development",
        requestUrl: "http://127.0.0.1:3000/en/forgot-password",
        siteUrl: "http://localhost:3001",
      })
    ).toBe("http://127.0.0.1:3000")
  })

  it("does not trust a request origin in production", () => {
    expect(
      resolvePasswordRecoveryOrigin({
        environment: "production",
        productionUrl: "plexus.example",
        requestUrl: "https://attacker.example/forgot-password",
        siteUrl: "https://www.plexus.enterprises",
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

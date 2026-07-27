import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { createLarkCodeChallenge, getLarkAuthorizationUrl } from "@/lib/lark"

describe("Lark authorization", () => {
  beforeEach(() => {
    vi.stubEnv("LARK_APP_ID", "lark-app-id")
    vi.stubEnv(
      "LARK_REDIRECT_URI",
      "https://www.plexus.enterprises/api/lark/callback"
    )
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("uses PKCE, state, and the exact configured redirect URI", () => {
    const verifier = "test-verifier"
    const challenge = createLarkCodeChallenge(verifier)
    const url = getLarkAuthorizationUrl({
      state: "opaque-state",
      codeChallenge: challenge,
    })

    expect(url.origin).toBe("https://accounts.larksuite.com")
    expect(url.searchParams.get("client_id")).toBe("lark-app-id")
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://www.plexus.enterprises/api/lark/callback"
    )
    expect(url.searchParams.get("state")).toBe("opaque-state")
    expect(url.searchParams.get("code_challenge")).toBe(challenge)
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("scope")).toContain("offline_access")
  })
})

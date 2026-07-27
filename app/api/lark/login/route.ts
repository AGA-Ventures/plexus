import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import { createLarkCodeChallenge, getLarkAuthorizationUrl } from "@/lib/lark"

const STATE_COOKIE = "plexus_lark_oauth_state"
const VERIFIER_COOKIE = "plexus_lark_oauth_verifier"

export async function GET() {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok || authorization.identity.role !== "superadmin") {
    return new Response("Superadmin access required.", {
      status: authorization.ok ? 403 : 401,
    })
  }

  const state = randomBytes(32).toString("base64url")
  const codeVerifier = randomBytes(48).toString("base64url")
  const cookieStore = await cookies()
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/lark/callback",
    maxAge: 10 * 60,
  }

  cookieStore.set(STATE_COOKIE, state, cookieOptions)
  cookieStore.set(VERIFIER_COOKIE, codeVerifier, cookieOptions)

  return Response.redirect(
    getLarkAuthorizationUrl({
      state,
      codeChallenge: createLarkCodeChallenge(codeVerifier),
    }),
    302
  )
}

import { timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import { exchangeLarkAuthorizationCode } from "@/lib/lark"

const STATE_COOKIE = "plexus_lark_oauth_state"
const VERIFIER_COOKIE = "plexus_lark_oauth_verifier"

function equalState(expected: string, received: string) {
  const expectedBytes = Buffer.from(expected)
  const receivedBytes = Buffer.from(received)
  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")
  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value
  const codeVerifier = cookieStore.get(VERIFIER_COOKIE)?.value

  cookieStore.delete(STATE_COOKIE)
  cookieStore.delete(VERIFIER_COOKIE)

  if (error) {
    return new Response("Lark authorization was not approved.", {
      status: 400,
    })
  }

  if (
    !code ||
    !state ||
    !expectedState ||
    !codeVerifier ||
    !equalState(expectedState, state)
  ) {
    return new Response("Invalid or expired Lark authorization state.", {
      status: 400,
    })
  }

  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok || authorization.identity.role !== "superadmin") {
    return new Response("Superadmin access required.", {
      status: authorization.ok ? 403 : 401,
    })
  }

  try {
    await exchangeLarkAuthorizationCode({ code, codeVerifier })
    return new Response(
      "Lark authorization complete. You can close this window."
    )
  } catch (authorizationError) {
    console.error("Lark authorization callback failed.", {
      error:
        authorizationError instanceof Error
          ? authorizationError.message
          : "Unexpected Lark authorization error.",
    })
    return new Response("Lark authorization could not be completed.", {
      status: 502,
    })
  }
}

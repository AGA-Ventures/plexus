import { NextResponse, type NextRequest } from "next/server"

import {
  getPasswordRecoveryFailurePath,
  parsePasswordResetPath,
} from "@/lib/password-recovery"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url)
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const tokenHash = request.nextUrl.searchParams.get("token_hash")
  const type = request.nextUrl.searchParams.get("type")
  const requestedNext = request.nextUrl.searchParams.get("next")
  const next = parsePasswordResetPath(requestedNext)

  if ((tokenHash && type === "recovery") || code) {
    const supabase = await createSupabaseServerClient()
    const { error } =
      tokenHash && type === "recovery"
        ? await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          })
        : await supabase.auth.exchangeCodeForSession(code!)

    if (!error) {
      return noStoreRedirect(new URL(next.path, request.url))
    }

    console.warn("Supabase password recovery verification failed.", {
      code: error.code,
      status: error.status,
      method: tokenHash ? "token_hash" : "pkce",
    })
  }

  return noStoreRedirect(
    new URL(getPasswordRecoveryFailurePath(requestedNext), request.url)
  )
}

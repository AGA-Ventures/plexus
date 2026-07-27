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
  const requestedNext = request.nextUrl.searchParams.get("next")
  const next = parsePasswordResetPath(requestedNext)

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return noStoreRedirect(new URL(next.path, request.url))
    }
  }

  return noStoreRedirect(
    new URL(getPasswordRecoveryFailurePath(requestedNext), request.url)
  )
}

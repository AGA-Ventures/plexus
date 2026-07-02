import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { getAppMetadata, getRolePortalPath, isAppRole } from "@/lib/auth"
import { normalizeLocale } from "@/lib/i18n"
import { getSupabaseConfig } from "@/lib/supabase/config"

const protectedRoutePattern =
  /^\/(?:(en|zh|cn|zh-Hant|zh-hant|zht|zh-tw|th)\/)?(admin|delegation|partner)(?:\/|$)/

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, publishableKey } = getSupabaseConfig()

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const match = request.nextUrl.pathname.match(protectedRoutePattern)

  if (!match) {
    await supabase.auth.getUser()
    return response
  }

  const locale = normalizeLocale(match[1])
  const requestedRole = match[2]

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${locale}/login`
    redirectUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const metadata = getAppMetadata(user)

  if (!metadata.role) {
    return NextResponse.redirect(
      new URL(`/${locale}/unauthorized`, request.url)
    )
  }

  if (isAppRole(requestedRole) && requestedRole !== metadata.role) {
    return NextResponse.redirect(
      new URL(getRolePortalPath(locale, metadata.role), request.url)
    )
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

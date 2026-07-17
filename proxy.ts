import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { getAppMetadata, getRolePortalPath, isAppRole } from "@/lib/auth"
import { localeParams, normalizeLocale } from "@/lib/i18n"
import { getSupabaseConfig } from "@/lib/supabase/config"

const localeParamPattern = localeParams
  .map((locale) => locale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|")
const protectedRoutePattern = new RegExp(
  `^/(?:(${localeParamPattern})/)?(admin|delegation|partner|compliance)(?:/|$)`
)

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
  const requestedRoute = match[2]

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

  if (requestedRoute === "compliance" && metadata.role !== "admin") {
    return NextResponse.redirect(
      new URL(getRolePortalPath(locale, metadata.role), request.url)
    )
  }

  if (isAppRole(requestedRoute) && requestedRoute !== metadata.role) {
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

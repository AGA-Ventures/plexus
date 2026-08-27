import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

import {
  getAppMetadata,
  getRoleBindingError,
  getRolePortalPath,
  isAppRole,
} from "@/lib/auth"
import { localeParams, normalizeLocale } from "@/lib/i18n"
import { getSupabaseConfig } from "@/lib/supabase/config"

const localeParamPattern = localeParams
  .map((locale) => locale.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|")
const protectedRoutePattern = new RegExp(
  `^/(?:(${localeParamPattern})/)?(superadmin|admin|vendor|delegation|partner|compliance)(?:/|$)`
)

export async function proxy(request: NextRequest) {
  const match = request.nextUrl.pathname.match(protectedRoutePattern)
  const localizedPathMatch = request.nextUrl.pathname.match(
    new RegExp(`^/(${localeParamPattern})(?:/|$)`)
  )
  const requestedLanguage = request.nextUrl.searchParams.get("lang")
  const documentLanguage =
    match?.[1] || localizedPathMatch?.[1]
      ? normalizeLocale(match?.[1] ?? localizedPathMatch?.[1])
      : requestedLanguage === "ms" || requestedLanguage === "my"
        ? "ms"
        : requestedLanguage &&
            [
              "zh-Hans",
              "zh-hans",
              "zh-Hant",
              "zh-hant",
              "zht",
              "zh-tw",
              "zh_TW",
              "tw",
              "zh",
              "cn",
            ].includes(requestedLanguage)
          ? "zh-Hans"
          : "en"
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-plexus-language", documentLanguage)
  const forwardedRequest = { headers: requestHeaders }

  // Public pages do not need an authenticated Supabase session. Keeping this
  // before the environment lookup prevents a missing auth configuration from
  // taking down the entire public website.
  if (!match) {
    return NextResponse.next({ request: forwardedRequest })
  }

  let response = NextResponse.next({ request: forwardedRequest })
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
        response = NextResponse.next({ request: forwardedRequest })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const locale = normalizeLocale(match[1])
  const requestedRoute = match[2]

  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (error || !claims) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = `/${locale}/login`
    redirectUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const metadata = getAppMetadata(claims)

  if (getRoleBindingError(metadata) || !metadata.role) {
    return NextResponse.redirect(
      new URL(`/${locale}/unauthorized`, request.url)
    )
  }

  if (
    requestedRoute === "compliance" &&
    !["superadmin", "admin"].includes(metadata.role)
  ) {
    return NextResponse.redirect(
      new URL(getRolePortalPath(locale, metadata.role), request.url)
    )
  }

  if (requestedRoute === "delegation" || requestedRoute === "partner") {
    if (metadata.role === "vendor") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = request.nextUrl.pathname.replace(
        `/${requestedRoute}`,
        "/vendor"
      )
      return NextResponse.redirect(redirectUrl)
    }

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

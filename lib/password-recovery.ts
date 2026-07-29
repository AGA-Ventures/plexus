import { isLocale, type Locale } from "@/lib/i18n"
import { normalizeTenantSlug } from "@/lib/tenant-login"

const fallbackOrigin = "http://localhost:3000"

export type PasswordRecoveryMode = "recovery" | "setup"

function withTenant(
  path: string,
  tenantSlug?: string | null,
  mode: PasswordRecoveryMode = "recovery"
) {
  const slug = normalizeTenantSlug(tenantSlug)
  const search = new URLSearchParams()

  if (slug) {
    search.set("tenant", slug)
  }

  if (mode === "setup") {
    search.set("mode", "setup")
  }

  const query = search.toString()
  return `${path}${query ? `?${query}` : ""}`
}

export function getForgotPasswordPath(
  locale: Locale,
  tenantSlug?: string | null
) {
  return withTenant(`/${locale}/forgot-password`, tenantSlug)
}

export function getResetPasswordPath(
  locale: Locale,
  tenantSlug?: string | null,
  mode: PasswordRecoveryMode = "recovery"
) {
  return withTenant(`/${locale}/reset-password`, tenantSlug, mode)
}

export function getLoginPath(
  locale: Locale,
  tenantSlug?: string | null,
  passwordUpdated = false
) {
  const search = new URLSearchParams()
  const slug = normalizeTenantSlug(tenantSlug)

  if (slug) {
    search.set("tenant", slug)
  }

  if (passwordUpdated) {
    search.set("passwordUpdated", "1")
  }

  const query = search.toString()
  return `/${locale}/login${query ? `?${query}` : ""}`
}

export function resolvePasswordRecoveryOrigin({
  productionUrl,
  siteUrl,
}: {
  productionUrl?: string
  siteUrl?: string
}) {
  const candidate = productionUrl
    ? `https://${productionUrl}`
    : siteUrl || fallbackOrigin

  try {
    const url = new URL(candidate)

    if (!["http:", "https:"].includes(url.protocol)) {
      return fallbackOrigin
    }

    return url.origin
  } catch {
    return fallbackOrigin
  }
}

export function getPasswordRecoveryRedirectUrl({
  origin,
  locale,
  tenantSlug,
  mode = "recovery",
}: {
  origin: string
  locale: Locale
  tenantSlug?: string | null
  mode?: PasswordRecoveryMode
}) {
  const callbackUrl = new URL("/auth/callback", origin)
  callbackUrl.searchParams.set(
    "next",
    getResetPasswordPath(locale, tenantSlug, mode)
  )
  return callbackUrl.toString()
}

export function parsePasswordResetPath(value?: string | null): {
  locale: Locale
  tenantSlug?: string
  mode: PasswordRecoveryMode
  path: string
} {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return {
      locale: "en",
      mode: "recovery",
      path: getResetPasswordPath("en"),
    }
  }

  const url = new URL(value, "https://plexus.invalid")
  const match = url.pathname.match(/^\/([^/]+)\/reset-password$/)
  const locale = match?.[1] && isLocale(match[1]) ? match[1] : "en"
  const tenantSlug = normalizeTenantSlug(url.searchParams.get("tenant"))
  const mode = url.searchParams.get("mode") === "setup" ? "setup" : "recovery"

  return {
    locale,
    tenantSlug,
    mode,
    path: getResetPasswordPath(locale, tenantSlug, mode),
  }
}

export function getPasswordRecoveryFailurePath(value?: string | null) {
  const { locale, tenantSlug } = parsePasswordResetPath(value)
  const path = getForgotPasswordPath(locale, tenantSlug)
  const separator = path.includes("?") ? "&" : "?"

  return `${path}${separator}error=invalid-link`
}

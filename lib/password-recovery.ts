import { isLocale, type Locale } from "@/lib/i18n"
import { normalizeTenantSlug } from "@/lib/tenant-login"

const fallbackOrigin = "http://localhost:3000"

function withTenant(path: string, tenantSlug?: string | null) {
  const slug = normalizeTenantSlug(tenantSlug)

  if (!slug) {
    return path
  }

  const search = new URLSearchParams({ tenant: slug })
  return `${path}?${search.toString()}`
}

export function getForgotPasswordPath(
  locale: Locale,
  tenantSlug?: string | null
) {
  return withTenant(`/${locale}/forgot-password`, tenantSlug)
}

export function getResetPasswordPath(
  locale: Locale,
  tenantSlug?: string | null
) {
  return withTenant(`/${locale}/reset-password`, tenantSlug)
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
}: {
  origin: string
  locale: Locale
  tenantSlug?: string | null
}) {
  const callbackUrl = new URL("/auth/callback", origin)
  callbackUrl.searchParams.set("next", getResetPasswordPath(locale, tenantSlug))
  return callbackUrl.toString()
}

export function parsePasswordResetPath(value?: string | null): {
  locale: Locale
  tenantSlug?: string
  path: string
} {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return {
      locale: "en",
      path: getResetPasswordPath("en"),
    }
  }

  const url = new URL(value, "https://plexus.invalid")
  const match = url.pathname.match(/^\/([^/]+)\/reset-password$/)
  const locale = match?.[1] && isLocale(match[1]) ? match[1] : "en"
  const tenantSlug = normalizeTenantSlug(url.searchParams.get("tenant"))

  return {
    locale,
    tenantSlug,
    path: getResetPasswordPath(locale, tenantSlug),
  }
}

export function getPasswordRecoveryFailurePath(value?: string | null) {
  const { locale, tenantSlug } = parsePasswordResetPath(value)
  const path = getForgotPasswordPath(locale, tenantSlug)
  const separator = path.includes("?") ? "&" : "?"

  return `${path}${separator}error=invalid-link`
}

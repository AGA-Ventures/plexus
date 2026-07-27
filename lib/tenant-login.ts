export type LoginBranding = {
  mode: "platform" | "tenant"
  slug?: string
  name: string
  logoUrl?: string
  primaryColor: string
  accentForeground: string
  supportEmail?: string
}

export const platformLoginBranding: LoginBranding = {
  mode: "platform",
  name: "Plexus",
  logoUrl: "/plexus-wordmark-transparent.png",
  primaryColor: "#6fdaea",
  accentForeground: "#21184a",
}

export function normalizeTenantSlug(value?: string | null) {
  const slug = value?.trim().toLowerCase()

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return undefined
  }

  return slug
}

export function tenantSlugFromHostname(value?: string | null) {
  const hostname = value?.split(",")[0]?.trim().toLowerCase().split(":")[0]

  if (!hostname || !hostname.endsWith(".plexus.com")) {
    return undefined
  }

  const slug = hostname.slice(0, -".plexus.com".length)

  if (["", "www", "app"].includes(slug) || slug.includes(".")) {
    return undefined
  }

  return normalizeTenantSlug(slug)
}

export function normalizeLogoUrl(value?: string | null) {
  const url = value?.trim()

  if (!url) {
    return undefined
  }

  if (url.startsWith("/") || url.startsWith("https://")) {
    return url
  }

  return undefined
}

export function normalizeBrandColor(value?: string | null) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "")
    ? (value as string).toLowerCase()
    : platformLoginBranding.primaryColor
}

export function readableForeground(hex: string) {
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000

  return luminance > 155 ? "#21184a" : "#ffffff"
}

export type LoginBranding = {
  mode: "platform" | "tenant"
  slug?: string
  name: string
  logoUrl?: string
  primaryColor: string
  accentForeground: string
  supportEmail?: string
  tenantUnavailable?: boolean
}

export const platformLoginBranding: LoginBranding = {
  mode: "platform",
  name: "Plexus",
  logoUrl: "/plexus-wordmark-transparent.png",
  primaryColor: "#0a84ff",
  accentForeground: "#071326",
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
  const relativeLuminance = (value: string) => {
    const channels = [1, 3, 5].map((index) =>
      Number.parseInt(value.slice(index, index + 2), 16)
    )
    const [red, green, blue] = channels.map((channel) => {
      const normalized = channel / 255
      return normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }
  const contrast = (foreground: string) => {
    const light = Math.max(
      relativeLuminance(hex),
      relativeLuminance(foreground)
    )
    const dark = Math.min(
      relativeLuminance(hex),
      relativeLuminance(foreground)
    )

    return (light + 0.05) / (dark + 0.05)
  }

  return contrast("#21184a") >= contrast("#ffffff")
    ? "#21184a"
    : "#ffffff"
}

import { headers } from "next/headers"

import enContent from "@/messages/public/en.json"
import msContent from "@/messages/public/ms.json"
import zhHantContent from "@/messages/public/zh-Hant.json"

export const publicLocales = ["en", "ms", "zh-Hant"] as const

export type PublicLocale = (typeof publicLocales)[number]
export type PublicContent = typeof enContent
export type PublicPageSlug = keyof PublicContent["pages"]
export type PublicLegalSlug = Exclude<
  keyof PublicContent["legal"],
  "staticNotice"
>

const contentByLocale: Record<PublicLocale, PublicContent> = {
  en: enContent,
  ms: msContent,
  "zh-Hant": zhHantContent,
}

export type TenantBranding = {
  tenantId: string | null
  name: string
  logoUrl: string
  entityLine: string
  socialLinks: {
    linkedin: string
    facebook: string
  }
}

export function normalizePublicLocale(value?: string): PublicLocale {
  if (value === "ms" || value === "my") {
    return "ms"
  }

  if (
    value === "zh-Hant" ||
    value === "zh-hant" ||
    value === "zht" ||
    value === "zh-tw" ||
    value === "zh_TW" ||
    value === "tw" ||
    value === "zh" ||
    value === "cn"
  ) {
    return "zh-Hant"
  }

  return "en"
}

export function getPublicContent(locale: PublicLocale) {
  return contentByLocale[locale]
}

export function withLocale(href: string, locale: PublicLocale) {
  if (href.startsWith("http") || href.startsWith("mailto:")) {
    return href
  }

  const separator = href.includes("?") ? "&" : "?"
  return `${href}${separator}lang=${locale}`
}

export async function getTenantBranding(
  content: PublicContent
): Promise<TenantBranding> {
  const headerStore = await headers()
  const host = headerStore.get("host") ?? ""
  const hostname = host.split(":")[0] ?? ""
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  const rootHosts = new Set(["plexus.com", "www.plexus.com", ""])
  const isTenantSubdomain =
    !isLocalhost && !rootHosts.has(hostname) && hostname.endsWith(".plexus.com")
  const tenantName = isTenantSubdomain
    ? hostname.replace(".plexus.com", "")
    : content.meta.siteName

  return {
    tenantId: isTenantSubdomain ? tenantName : null,
    name: tenantName,
    logoUrl: "/plexus-brand-wordmark.png",
    entityLine: content.footer.entityLine,
    socialLinks: {
      linkedin: "#",
      facebook: "#",
    },
  }
}

import "server-only"

import { headers } from "next/headers"

import {
  normalizeBrandColor,
  normalizeLogoUrl,
  normalizeTenantSlug,
  platformLoginBranding,
  readableForeground,
  tenantSlugFromHostname,
  type LoginBranding,
} from "@/lib/tenant-login"
import {
  createSupabaseAdminClient,
  hasSupabaseAdminSecret,
} from "@/lib/supabase/admin"

export type TenantBrandingRow = {
  slug: string
  name: string
  support_email: string
  logo_url: string
  primary_color: string
}

export function getTenantLoginBranding(tenant: TenantBrandingRow) {
  const primaryColor = normalizeBrandColor(tenant.primary_color)

  return {
    mode: "tenant",
    slug: tenant.slug,
    name: tenant.name,
    logoUrl: normalizeLogoUrl(tenant.logo_url),
    primaryColor,
    accentForeground: readableForeground(primaryColor),
    supportEmail: tenant.support_email || undefined,
  } satisfies LoginBranding
}

export async function getLoginBranding(requestedSlug?: string) {
  const requestHeaders = await headers()
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const slug =
    tenantSlugFromHostname(host) ?? normalizeTenantSlug(requestedSlug)

  if (!slug || !hasSupabaseAdminSecret()) {
    return platformLoginBranding
  }

  try {
    const result = await createSupabaseAdminClient()
      .from("admin_tenants")
      .select("slug, name, support_email, logo_url, primary_color")
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle()

    if (result.error || !result.data) {
      return platformLoginBranding
    }

    return getTenantLoginBranding(result.data as TenantBrandingRow)
  } catch {
    return platformLoginBranding
  }
}

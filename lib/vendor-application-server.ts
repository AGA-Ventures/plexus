import "server-only"

import { getTenantLoginBranding } from "@/lib/login-branding"
import {
  createSupabaseAdminClient,
  hasSupabaseAdminSecret,
} from "@/lib/supabase/admin"
import { normalizeTenantSlug, type LoginBranding } from "@/lib/tenant-login"

export type VendorApplicationTenant = {
  id: string
  branding: LoginBranding & { mode: "tenant"; slug: string }
}

export async function getActiveVendorApplicationTenant(
  requestedSlug?: string | null
): Promise<VendorApplicationTenant | null> {
  const slug = normalizeTenantSlug(requestedSlug)

  if (!slug || !hasSupabaseAdminSecret()) {
    return null
  }

  const result = await createSupabaseAdminClient()
    .from("admin_tenants")
    .select("id, slug, name, support_email, logo_url, primary_color")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()

  if (result.error || !result.data) {
    return null
  }

  return {
    id: result.data.id,
    branding: getTenantLoginBranding(result.data) as LoginBranding & {
      mode: "tenant"
      slug: string
    },
  }
}

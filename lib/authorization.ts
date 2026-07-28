import "server-only"

import type { SupabaseClient, User } from "@supabase/supabase-js"

import {
  getAppMetadata,
  getRoleBindingError,
  type AppMetadata,
  type AppRole,
  type VendorType,
} from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export type AuthenticatedIdentity = {
  userId: string
  email: string
  displayName: string
  role: AppRole
  adminId?: string
  vendorCompanyId?: string
  vendorType?: VendorType
  tenantName?: string
  tenantSupportEmail?: string
  tenantPrimaryColor?: string
  tenantLogoUrl?: string
}

type ProfileRow = {
  id: string
  role: AppRole
  display_name: string
  email: string
  admin_id: string | null
  vendor_company_id: string | null
  vendor_type: VendorType | null
  active: boolean
}

function profileMatchesMetadata(profile: ProfileRow, metadata: AppMetadata) {
  return (
    profile.role === metadata.role &&
    profile.admin_id === (metadata.admin_id ?? null) &&
    profile.vendor_company_id === (metadata.vendor_company_id ?? null) &&
    profile.vendor_type === (metadata.vendor_type ?? null)
  )
}

export async function validateAuthenticatedUser(
  supabase: SupabaseClient,
  user: User
): Promise<
  { ok: true; identity: AuthenticatedIdentity } | { ok: false; error: string }
> {
  const metadata = getAppMetadata(user)
  const bindingError = getRoleBindingError(metadata)

  if (bindingError || !metadata.role) {
    return {
      ok: false,
      error: bindingError ?? "This account has no valid Plexus role.",
    }
  }

  const profileResult = await supabase
    .from("user_profiles")
    .select(
      "id, role, display_name, email, admin_id, vendor_company_id, vendor_type, active"
    )
    .eq("id", user.id)
    .maybeSingle()

  if (profileResult.error || !profileResult.data) {
    return {
      ok: false,
      error:
        "This account is not active or its database profile has not been provisioned.",
    }
  }

  const profile = profileResult.data as ProfileRow

  if (!profile.active || !profileMatchesMetadata(profile, metadata)) {
    return {
      ok: false,
      error:
        "This account's trusted claims do not match its active database profile.",
    }
  }

  let tenantDetails:
    | {
        name: string
        support_email: string
        primary_color: string
        logo_url: string
      }
    | undefined

  if (metadata.role === "vendor") {
    const vendorResult = await supabase
      .from("vendor_companies")
      .select("id, admin_id, vendor_type, status")
      .eq("id", metadata.vendor_company_id!)
      .eq("admin_id", metadata.admin_id!)
      .eq("vendor_type", metadata.vendor_type!)
      .eq("status", "active")
      .maybeSingle()

    if (vendorResult.error || !vendorResult.data) {
      return { ok: false, error: "This Vendor company is not active." }
    }
  }

  if (metadata.role === "admin" || metadata.role === "vendor") {
    const tenantResult = await supabase
      .from("admin_tenants")
      .select("id, status, name, support_email, primary_color, logo_url")
      .eq("id", metadata.admin_id!)
      .eq("status", "active")
      .maybeSingle()

    if (tenantResult.error || !tenantResult.data) {
      return {
        ok: false,
        error:
          metadata.role === "admin"
            ? "This Admin tenant is not active."
            : "This Vendor's Admin tenant is not active.",
      }
    }

    tenantDetails = tenantResult.data
  }

  return {
    ok: true,
    identity: {
      userId: user.id,
      email: user.email ?? profile.email,
      displayName: profile.display_name,
      role: metadata.role,
      adminId: metadata.admin_id,
      vendorCompanyId: metadata.vendor_company_id,
      vendorType: metadata.vendor_type,
      tenantName: tenantDetails?.name,
      tenantSupportEmail: tenantDetails?.support_email,
      tenantPrimaryColor: tenantDetails?.primary_color,
      tenantLogoUrl: tenantDetails?.logo_url,
    },
  }
}

export async function getAuthenticatedIdentity() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      ok: false as const,
      error: "Authentication required.",
      supabase,
    }
  }

  const result = await validateAuthenticatedUser(supabase, user)

  if (!result.ok) {
    return { ...result, supabase }
  }

  return { ...result, supabase }
}

export function canOperateTenant(
  identity: AuthenticatedIdentity,
  adminId: string
) {
  return (
    identity.role === "superadmin" ||
    (identity.role === "admin" && identity.adminId === adminId)
  )
}

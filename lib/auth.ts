import type { Locale } from "@/lib/i18n"

export type AppRole = "superadmin" | "admin" | "vendor"
export type VendorType = "delegation" | "partner"

export type AppMetadata = {
  role?: AppRole
  admin_id?: string
  vendor_company_id?: string
  vendor_type?: VendorType
}

export const portalRoles: AppRole[] = ["superadmin", "admin", "vendor"]
export const vendorTypes: VendorType[] = ["delegation", "partner"]

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value)
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && portalRoles.includes(value as AppRole)
}

export function isVendorType(value: unknown): value is VendorType {
  return typeof value === "string" && vendorTypes.includes(value as VendorType)
}

export function getAppMetadata(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  const metadata = user?.app_metadata ?? {}

  return {
    role: isAppRole(metadata.role) ? metadata.role : undefined,
    admin_id: isUuid(metadata.admin_id) ? metadata.admin_id : undefined,
    vendor_company_id:
      isUuid(metadata.vendor_company_id) ? metadata.vendor_company_id : undefined,
    vendor_type: isVendorType(metadata.vendor_type) ? metadata.vendor_type : undefined,
  } satisfies AppMetadata
}

export function getRoleBindingError(metadata: AppMetadata) {
  if (!metadata.role) {
    return "This account has no valid Plexus role. Ask a platform administrator to set app_metadata.role."
  }

  if (metadata.role === "superadmin") {
    if (metadata.admin_id || metadata.vendor_company_id || metadata.vendor_type) {
      return "This Superadmin account has unexpected tenant bindings."
    }

    return undefined
  }

  if (!metadata.admin_id) {
    return "This account has no valid admin_id tenant binding."
  }

  if (metadata.role === "admin") {
    if (metadata.vendor_company_id || metadata.vendor_type) {
      return "This Admin account has unexpected Vendor bindings."
    }

    return undefined
  }

  if (!metadata.vendor_company_id || !metadata.vendor_type) {
    return "This Vendor account needs valid admin_id, vendor_company_id, and vendor_type bindings."
  }

  return undefined
}

export function hasValidRoleBinding(metadata: AppMetadata) {
  return !getRoleBindingError(metadata)
}

export function getRolePortalPath(locale: Locale, role?: AppRole) {
  return `/${locale}/${role ?? "login"}`
}

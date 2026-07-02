import type { Locale } from "@/lib/i18n"

export type AppRole = "admin" | "delegation" | "partner"

export type AppMetadata = {
  role?: AppRole
  delegation_company_id?: string
  partner_company_id?: string
}

export const portalRoles: AppRole[] = ["admin", "delegation", "partner"]

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && portalRoles.includes(value as AppRole)
}

export function getAppMetadata(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  const metadata = user?.app_metadata ?? {}

  return {
    role: isAppRole(metadata.role) ? metadata.role : undefined,
    delegation_company_id:
      typeof metadata.delegation_company_id === "string" ? metadata.delegation_company_id : undefined,
    partner_company_id:
      typeof metadata.partner_company_id === "string" ? metadata.partner_company_id : undefined,
  } satisfies AppMetadata
}

export function getRolePortalPath(locale: Locale, role?: AppRole) {
  return `/${locale}/${role ?? "login"}`
}


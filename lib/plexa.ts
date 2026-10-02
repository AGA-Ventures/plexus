import type { AppRole } from "@/lib/auth"

export const PLEXA_ROLE_ACCESS_SETTING_KEY = "plexa_role_access"

export type PlexaRoleAccess = {
  admin: boolean
  vendor: boolean
}

export const defaultPlexaRoleAccess: PlexaRoleAccess = {
  admin: false,
  vendor: false,
}

export function normalizePlexaRoleAccess(value: unknown): PlexaRoleAccess {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultPlexaRoleAccess
  }

  const candidate = value as Record<string, unknown>

  return {
    admin: candidate.admin === true,
    vendor: candidate.vendor === true,
  }
}

export function canRoleAccessPlexa(role: AppRole, value: unknown) {
  if (role === "superadmin") {
    return true
  }

  const access = normalizePlexaRoleAccess(value)
  return role === "admin" ? access.admin : access.vendor
}

import "server-only"

import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import { isMalaysiaMarket } from "@/lib/markets"

export const complianceVendorIds = ["worldCheck", "ssm", "ctos"] as const

export type ComplianceVendorId = (typeof complianceVendorIds)[number]
export type ComplianceVendorStatus =
  | "configured"
  | "not_configured"
  | "skipped"
  | "error"

export type ComplianceVendor = {
  id: ComplianceVendorId
  label: string
  purpose: string
  requiredEnv: string[]
}

export const complianceVendors: Record<ComplianceVendorId, ComplianceVendor> = {
  worldCheck: {
    id: "worldCheck",
    label: "World-Check AML screening",
    purpose:
      "International sanctions, PEP, adverse media and AML watchlist screening.",
    requiredEnv: ["WORLD_CHECK_ENDPOINT", "WORLD_CHECK_API_KEY"],
  },
  ssm: {
    id: "ssm",
    label: "Malaysia SSM company registry",
    purpose:
      "Malaysia company registration and corporate profile verification.",
    requiredEnv: ["MALAYSIA_SSM_ENDPOINT", "MALAYSIA_SSM_API_KEY"],
  },
  ctos: {
    id: "ctos",
    label: "Malaysia CTOS corporate credit",
    purpose: "Malaysia corporate credit and business risk checks.",
    requiredEnv: ["CTOS_ENDPOINT", "CTOS_API_KEY"],
  },
}

const vendorEnv: Record<
  ComplianceVendorId,
  { endpoint: string; apiKey: string }
> = {
  worldCheck: {
    endpoint: "WORLD_CHECK_ENDPOINT",
    apiKey: "WORLD_CHECK_API_KEY",
  },
  ssm: {
    endpoint: "MALAYSIA_SSM_ENDPOINT",
    apiKey: "MALAYSIA_SSM_API_KEY",
  },
  ctos: {
    endpoint: "CTOS_ENDPOINT",
    apiKey: "CTOS_API_KEY",
  },
}

export const complianceScreeningInputSchema = z.object({
  companyName: z.string().trim().min(1).max(240),
  registrationNumber: z.string().trim().max(120).optional(),
  countryRegion: z.string().trim().min(1).max(120),
  contactName: z.string().trim().max(160).optional(),
  checkTypes: z.array(z.enum(complianceVendorIds)).optional(),
})

export type ComplianceScreeningInput = z.infer<
  typeof complianceScreeningInputSchema
>

export function getComplianceVendorStatus() {
  return complianceVendorIds.map((id) => {
    const env = vendorEnv[id]
    const configured = Boolean(
      process.env[env.endpoint] && process.env[env.apiKey]
    )

    return {
      ...complianceVendors[id],
      status: configured
        ? ("configured" as const)
        : ("not_configured" as const),
    }
  })
}

export async function requireComplianceAdmin() {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return {
      ok: false as const,
      status: 401,
      error: authorization.error,
    }
  }

  if (!["superadmin", "admin"].includes(authorization.identity.role)) {
    return {
      ok: false as const,
      status: 403,
      error: "Superadmin or Admin access required.",
    }
  }

  return { ok: true as const, identity: authorization.identity }
}

export async function runComplianceScreening(input: ComplianceScreeningInput) {
  const requestedChecks = input.checkTypes ?? [...complianceVendorIds]
  const malaysiaCompany = isMalaysiaMarket(input.countryRegion)

  const checks = await Promise.all(
    requestedChecks.map(async (vendorId) => {
      if ((vendorId === "ssm" || vendorId === "ctos") && !malaysiaCompany) {
        return {
          vendorId,
          label: complianceVendors[vendorId].label,
          status: "skipped" as ComplianceVendorStatus,
          message: "Malaysia-only check skipped for this country/region.",
        }
      }

      return callComplianceVendor(vendorId, input)
    })
  )

  return {
    screenedAt: new Date().toISOString(),
    companyName: input.companyName,
    countryRegion: input.countryRegion,
    checks,
  }
}

async function callComplianceVendor(
  vendorId: ComplianceVendorId,
  input: ComplianceScreeningInput
) {
  const vendor = complianceVendors[vendorId]
  const env = vendorEnv[vendorId]
  const endpoint = process.env[env.endpoint]
  const apiKey = process.env[env.apiKey]

  if (!endpoint || !apiKey) {
    return {
      vendorId,
      label: vendor.label,
      status: "not_configured" as ComplianceVendorStatus,
      message: `Set ${env.endpoint} and ${env.apiKey} to enable this check.`,
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vendor: vendorId,
        companyName: input.companyName,
        registrationNumber: input.registrationNumber,
        countryRegion: input.countryRegion,
        contactName: input.contactName,
      }),
      signal: controller.signal,
    })

    const contentType = response.headers.get("content-type") ?? ""
    const vendorResponse = contentType.includes("application/json")
      ? await response.json()
      : await response.text()

    if (!response.ok) {
      return {
        vendorId,
        label: vendor.label,
        status: "error" as ComplianceVendorStatus,
        message: `Vendor returned HTTP ${response.status}.`,
        vendorResponse,
      }
    }

    return {
      vendorId,
      label: vendor.label,
      status: "configured" as ComplianceVendorStatus,
      message: "Vendor endpoint responded successfully.",
      vendorResponse,
    }
  } catch (error) {
    return {
      vendorId,
      label: vendor.label,
      status: "error" as ComplianceVendorStatus,
      message:
        error instanceof Error
          ? error.message
          : "Vendor request failed unexpectedly.",
    }
  } finally {
    clearTimeout(timeout)
  }
}

import "server-only"

import { redirect } from "next/navigation"

import type { AppRole, VendorType } from "@/lib/auth"
import { getAuthenticatedIdentity } from "@/lib/authorization"
import type { EmailDelivery } from "@/lib/email-delivery"
import { getEmailProviderReadiness } from "@/lib/email-delivery-service"
import type { Locale } from "@/lib/i18n"
import { hasSupabaseAdminSecret } from "@/lib/supabase/admin"
import type { TChinaEvent, TChinaRegistration } from "@/lib/tchina-expo"
import type { VendorApplication } from "@/lib/vendor-applications"

export type TenantStatus = "active" | "suspended" | "archived"
export type VendorStatus = "active" | "suspended" | "archived"

export type AdminTenant = {
  id: string
  slug: string
  name: string
  status: TenantStatus
  support_email: string
  logo_url: string
  primary_color: string
  vendor_discovery_enabled: boolean
  created_at: string
  updated_at: string
}

type ManagedVendorBase = {
  id: string
  admin_id: string
  vendor_type: VendorType
  name_en: string
  name_cn: string
  sector: string
  status: VendorStatus
  created_at: string
  updated_at: string
}

export type ManagedVendor = ManagedVendorBase & {
  company_size: string
  contact: string
  contact_meta: string
  profile_complete: number
  origin: string
  needs: string
  coordinator: string
  partner_type: "Government" | "Association" | "Enterprise"
  offerings: string
}

export type ManagedAccount = {
  id: string
  display_name: string
  email: string
  role: AppRole
  admin_id: string | null
  vendor_company_id: string | null
  vendor_type: VendorType | null
  active: boolean
  created_at: string
  updated_at: string
}

export type AuditEvent = {
  id: string
  actor_user_id: string | null
  actor_role: AppRole | null
  action: string
  target_table: string
  target_id: string | null
  admin_id: string | null
  request_id: string | null
  before_values: Record<string, unknown> | null
  after_values: Record<string, unknown> | null
  created_at: string
}

export type TenantOperationalCount = {
  admin_id: string
}

export type PlatformSetting = {
  id: string
  setting_key: string
  category: "plans" | "permissions" | "reference" | "operations"
  value: unknown
  description: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

export type MeetingCreationIncident = {
  id: string
  match_id: string
  admin_id: string
  provider: "zoom" | "lark"
  status: "failed"
  attempt_count: number
  failure_code: string
  failure_summary: string
  last_attempt_at: string
  created_at: string
  updated_at: string
}

function rowsOrThrow<T>(
  data: T[] | null,
  error: { message: string } | null,
  label: string
) {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return data ?? []
}

type DelegationDirectoryDetails = {
  vendor_company_id: string
  company_size: string
  contact: string
  contact_meta: string
  profile_complete: number
  origin: string
  needs: string
  coordinator: string
}

type PartnerDirectoryDetails = {
  vendor_company_id: string
  company_size: string
  contact: string
  contact_meta: string
  profile_complete: number
  partner_type: ManagedVendor["partner_type"]
  offerings: string
}

function enrichManagedVendors(
  vendors: ManagedVendorBase[],
  delegationDetails: DelegationDirectoryDetails[],
  partnerDetails: PartnerDirectoryDetails[]
): ManagedVendor[] {
  const delegationByVendor = new Map(
    delegationDetails.map((details) => [details.vendor_company_id, details])
  )
  const partnerByVendor = new Map(
    partnerDetails.map((details) => [details.vendor_company_id, details])
  )

  return vendors.map((vendor) => {
    const delegation = delegationByVendor.get(vendor.id)
    const partner = partnerByVendor.get(vendor.id)

    return {
      ...vendor,
      company_size:
        delegation?.company_size ?? partner?.company_size ?? "Pending",
      contact: delegation?.contact ?? partner?.contact ?? "",
      contact_meta: delegation?.contact_meta ?? partner?.contact_meta ?? "",
      profile_complete:
        delegation?.profile_complete ?? partner?.profile_complete ?? 0,
      origin: delegation?.origin ?? "",
      needs: delegation?.needs ?? "",
      coordinator: delegation?.coordinator ?? "",
      partner_type: partner?.partner_type ?? "Enterprise",
      offerings: partner?.offerings ?? "",
    }
  })
}

export async function getSuperadminManagementData(locale: Locale) {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    redirect(`/${locale}/login`)
  }

  if (authorization.identity.role !== "superadmin") {
    redirect(`/${locale}/${authorization.identity.role}`)
  }

  const supabase = authorization.supabase
  const [
    tenantsResult,
    vendorsResult,
    delegationDetailsResult,
    partnerDetailsResult,
    accountsResult,
    applicationsResult,
    auditResult,
    matchesResult,
    meetingsResult,
    dealsResult,
    settingsResult,
    meetingIncidentsResult,
    emailDeliveriesResult,
    tchinaEventResult,
    tchinaRegistrationsResult,
  ] = await Promise.all([
    supabase
      .from("admin_tenants")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_companies")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("delegation_companies")
      .select(
        "vendor_company_id, company_size, contact, contact_meta, profile_complete, origin, needs, coordinator"
      ),
    supabase
      .from("partner_companies")
      .select(
        "vendor_company_id, company_size, contact, contact_meta, profile_complete, partner_type, offerings"
      ),
    supabase
      .from("user_profiles")
      .select(
        "id, display_name, email, role, admin_id, vendor_company_id, vendor_type, active, created_at, updated_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("matches").select("admin_id"),
    supabase.from("meetings").select("admin_id"),
    supabase.from("deals").select("admin_id"),
    supabase
      .from("platform_settings")
      .select("*")
      .order("category", { ascending: true })
      .order("setting_key", { ascending: true }),
    supabase
      .from("meeting_creation_jobs")
      .select(
        "id, match_id, admin_id, provider, status, attempt_count, failure_code, failure_summary, last_attempt_at, created_at, updated_at"
      )
      .eq("status", "failed")
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase
      .from("email_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("tchina_events")
      .select("*")
      .eq("singleton_key", "plexus")
      .maybeSingle(),
    supabase
      .from("event_registrations")
      .select("*")
      .order("created_at", { ascending: false }),
  ])

  if (tchinaEventResult.error) {
    throw new Error(`Load TChina event: ${tchinaEventResult.error.message}`)
  }

  return {
    session: authorization.identity,
    provisioningConfigured: hasSupabaseAdminSecret(),
    tenants: rowsOrThrow<AdminTenant>(
      tenantsResult.data,
      tenantsResult.error,
      "Load Admin tenants"
    ),
    vendors: enrichManagedVendors(
      rowsOrThrow<ManagedVendorBase>(
        vendorsResult.data,
        vendorsResult.error,
        "Load Vendors"
      ),
      rowsOrThrow<DelegationDirectoryDetails>(
        delegationDetailsResult.data,
        delegationDetailsResult.error,
        "Load Delegation details"
      ),
      rowsOrThrow<PartnerDirectoryDetails>(
        partnerDetailsResult.data,
        partnerDetailsResult.error,
        "Load Partner details"
      )
    ),
    accounts: rowsOrThrow<ManagedAccount>(
      accountsResult.data,
      accountsResult.error,
      "Load accounts"
    ),
    applications: rowsOrThrow<VendorApplication>(
      applicationsResult.data,
      applicationsResult.error,
      "Load Vendor applications"
    ),
    auditEvents: rowsOrThrow<AuditEvent>(
      auditResult.data,
      auditResult.error,
      "Load audit events"
    ),
    platformSettings: rowsOrThrow<PlatformSetting>(
      settingsResult.data,
      settingsResult.error,
      "Load platform settings"
    ),
    meetingCreationIncidents: rowsOrThrow<MeetingCreationIncident>(
      meetingIncidentsResult.data,
      meetingIncidentsResult.error,
      "Load critical meeting incidents"
    ),
    emailDeliveries: rowsOrThrow<EmailDelivery>(
      emailDeliveriesResult.data,
      emailDeliveriesResult.error,
      "Load email deliveries"
    ),
    emailProviderReadiness: getEmailProviderReadiness(),
    tchinaEvent: (tchinaEventResult.data as TChinaEvent | null) ?? null,
    tchinaRegistrations: rowsOrThrow<TChinaRegistration>(
      tchinaRegistrationsResult.data,
      tchinaRegistrationsResult.error,
      "Load TChina registrations"
    ),
    operations: {
      matches: rowsOrThrow<TenantOperationalCount>(
        matchesResult.data,
        matchesResult.error,
        "Load match reporting"
      ),
      meetings: rowsOrThrow<TenantOperationalCount>(
        meetingsResult.data,
        meetingsResult.error,
        "Load meeting reporting"
      ),
      deals: rowsOrThrow<TenantOperationalCount>(
        dealsResult.data,
        dealsResult.error,
        "Load deal reporting"
      ),
    },
  }
}

export async function getAdminManagementData(locale: Locale) {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    redirect(`/${locale}/login`)
  }

  if (
    authorization.identity.role !== "admin" ||
    !authorization.identity.adminId
  ) {
    redirect(`/${locale}/${authorization.identity.role}`)
  }

  const supabase = authorization.supabase
  const [
    tenantResult,
    vendorsResult,
    delegationDetailsResult,
    partnerDetailsResult,
    accountsResult,
    applicationsResult,
    auditResult,
    provisioningPermissionResult,
  ] = await Promise.all([
    supabase
      .from("admin_tenants")
      .select("*")
      .eq("id", authorization.identity.adminId)
      .single(),
    supabase
      .from("vendor_companies")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("delegation_companies")
      .select(
        "vendor_company_id, company_size, contact, contact_meta, profile_complete, origin, needs, coordinator"
      ),
    supabase
      .from("partner_companies")
      .select(
        "vendor_company_id, company_size, contact, contact_meta, profile_complete, partner_type, offerings"
      ),
    supabase
      .from("user_profiles")
      .select(
        "id, display_name, email, role, admin_id, vendor_company_id, vendor_type, active, created_at, updated_at"
      )
      .eq("role", "vendor")
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("platform_settings")
      .select("value")
      .eq("setting_key", "vendor_account_provisioning")
      .maybeSingle(),
  ])

  if (tenantResult.error || !tenantResult.data) {
    throw new Error(
      `Load Admin tenant: ${tenantResult.error?.message ?? "Not found"}`
    )
  }

  return {
    session: authorization.identity,
    provisioningConfigured: hasSupabaseAdminSecret(),
    vendorProvisioningEnabled:
      provisioningPermissionResult.data?.value === true,
    tenant: tenantResult.data as AdminTenant,
    vendors: enrichManagedVendors(
      rowsOrThrow<ManagedVendorBase>(
        vendorsResult.data,
        vendorsResult.error,
        "Load tenant Vendors"
      ),
      rowsOrThrow<DelegationDirectoryDetails>(
        delegationDetailsResult.data,
        delegationDetailsResult.error,
        "Load tenant Delegation details"
      ),
      rowsOrThrow<PartnerDirectoryDetails>(
        partnerDetailsResult.data,
        partnerDetailsResult.error,
        "Load tenant Partner details"
      )
    ),
    accounts: rowsOrThrow<ManagedAccount>(
      accountsResult.data,
      accountsResult.error,
      "Load tenant Vendor accounts"
    ),
    applications: rowsOrThrow<VendorApplication>(
      applicationsResult.data,
      applicationsResult.error,
      "Load tenant Vendor applications"
    ),
    auditEvents: rowsOrThrow<AuditEvent>(
      auditResult.data,
      auditResult.error,
      "Load tenant audit events"
    ),
  }
}

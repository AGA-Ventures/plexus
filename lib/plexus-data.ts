import "server-only"

import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  getRolePortalPath,
  type AppRole,
  type VendorType,
} from "@/lib/auth"
import { validateAuthenticatedUser } from "@/lib/authorization"
import type { Locale } from "@/lib/i18n"
import { seedDb } from "@/lib/local-db"
import type {
  CompanyRegistrationProfile,
  Deal,
  DelegationCompany,
  EventResource,
  LiaisonContact,
  LocalDb,
  Match,
  Meeting,
  PartnerCompany,
  SiteVisit,
} from "@/lib/local-db"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type DbClient = SupabaseClient

type DelegationCompanyRow = {
  id: string
  name_en: string
  name_cn: string
  sector: string
  origin: string
  company_size: string
  needs: string
  contact: string
  contact_meta: string
  status: DelegationCompany["status"]
  profile_complete: number
  urgent: boolean
  coordinator: string
  profile_data: CompanyRegistrationProfile | null
}

type PartnerCompanyRow = {
  id: string
  name_en: string
  name_cn: string
  sector: string
  partner_type: PartnerCompany["type"]
  company_size: string
  offerings: string
  contact: string
  contact_meta: string
  status: PartnerCompany["status"]
  profile_complete: number
  verified: PartnerCompany["verified"]
  attendance: PartnerCompany["attendance"]
  arrived: boolean
  profile_data: CompanyRegistrationProfile | null
}

type MatchRow = {
  id: string
  delegation_company_id: string
  partner_company_id: string
  status: Match["status"]
  score: number
  note: string
}

type InterpreterRow = {
  id: string
  name: string
  languages: string
  email: string
  notes: string
  available: boolean
}

type MeetingRow = {
  id: string
  match_id: string
  starts_at: string
  duration_minutes: number
  platform: Meeting["platform"]
  link: string
  interpreter: string
  requested_interpreter_id: string | null
  host: string
  status: Meeting["status"]
  summary: string
}

type DealRow = {
  id: string
  match_id: string
  status: Deal["status"]
  document: string
  signatory_check: Deal["signatoryCheck"]
}

type ItinerarySlotRow = {
  id: string
  day_label: string
  start_time: string
  activity: string
  venue: string
  escort: string
  published: boolean
}

type SiteVisitRow = {
  id: string
  venue: string
  visit_date: string
  start_time: string
  driver: string
  escort: string
  status: SiteVisit["status"]
  notes: string
}

type SiteVisitDelegationRow = {
  site_visit_id: string
  delegation_company_id: string
}

type LiaisonContactRow = {
  id: string
  name: string
  title: string
  organisation: string
  status: LiaisonContact["status"]
  protocol: string
}

type NotificationRow = {
  message: string
}

type AnnouncementRow = {
  id: string
  title: string
  message: string
  target: "all" | "delegation" | "partner" | "admin"
  channel: "email" | "notification" | "both"
  status: "Draft" | "Queued" | "Sent"
  sent_at: string | null
  created_by: string
}

type ResourceRow = {
  id: string
  title: string
  category: EventResource["category"]
  file_name: string
  file_url: string
  storage_path: string | null
  audience: EventResource["audience"]
  visible_to_delegation: boolean
  notes: string
  updated_at: string
}

export type PortalSession = {
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

function assertRows<T>(
  data: T[] | null,
  error: { message: string } | null,
  label: string
): T[] {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }

  return data ?? []
}

function optionalRows<T>(
  data: T[] | null,
  error: { message: string } | null,
  fallback: T[]
): T[] {
  if (error) {
    return fallback
  }

  return data ?? fallback
}

function profileDataOrUndefined(profile: CompanyRegistrationProfile | null) {
  return profile?.companyNameEn ? profile : undefined
}

export async function loadPlexusDb(supabase: DbClient): Promise<LocalDb> {
  const [
    delegationCompaniesResult,
    partnerCompaniesResult,
    matchesResult,
    interpretersResult,
    meetingsResult,
    dealsResult,
    itineraryResult,
    siteVisitsResult,
    siteVisitDelegationsResult,
    liaisonResult,
    notificationsResult,
    announcementsResult,
    resourcesResult,
  ] = await Promise.all([
    supabase
      .from("delegation_companies")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("partner_companies")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("interpreters")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("meetings")
      .select("*")
      .order("starts_at", { ascending: true }),
    supabase.from("deals").select("*").order("created_at", { ascending: true }),
    supabase
      .from("itinerary_slots")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("site_visits")
      .select("*")
      .order("visit_date", { ascending: true }),
    supabase.from("site_visit_delegations").select("*"),
    supabase
      .from("liaison_contacts")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("notifications")
      .select("message")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("event_resources")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50),
  ])

  const delegationRows = assertRows<DelegationCompanyRow>(
    delegationCompaniesResult.data,
    delegationCompaniesResult.error,
    "Load delegation companies"
  )
  const partnerRows = assertRows<PartnerCompanyRow>(
    partnerCompaniesResult.data,
    partnerCompaniesResult.error,
    "Load partner companies"
  )
  const matchRows = assertRows<MatchRow>(
    matchesResult.data,
    matchesResult.error,
    "Load matches"
  )
  const interpreterRows = optionalRows<InterpreterRow>(
    interpretersResult.data,
    interpretersResult.error,
    []
  )
  const meetingRows = assertRows<MeetingRow>(
    meetingsResult.data,
    meetingsResult.error,
    "Load meetings"
  )
  const dealRows = assertRows<DealRow>(
    dealsResult.data,
    dealsResult.error,
    "Load deals"
  )
  const itineraryRows = assertRows<ItinerarySlotRow>(
    itineraryResult.data,
    itineraryResult.error,
    "Load itinerary"
  )
  const siteVisitRows = assertRows<SiteVisitRow>(
    siteVisitsResult.data,
    siteVisitsResult.error,
    "Load site visits"
  )
  const siteVisitDelegationRows = assertRows<SiteVisitDelegationRow>(
    siteVisitDelegationsResult.data,
    siteVisitDelegationsResult.error,
    "Load site visit delegations"
  )
  const liaisonRows = assertRows<LiaisonContactRow>(
    liaisonResult.data,
    liaisonResult.error,
    "Load liaison contacts"
  )
  const notificationRows = assertRows<NotificationRow>(
    notificationsResult.data,
    notificationsResult.error,
    "Load notifications"
  )
  const announcementRows = optionalRows<AnnouncementRow>(
    announcementsResult.data,
    announcementsResult.error,
    []
  )
  const resourceRows = optionalRows<ResourceRow>(
    resourcesResult.data,
    resourcesResult.error,
    []
  )

  return {
    delegationCompanies: delegationRows.map((row) => ({
      id: row.id,
      role: "delegation",
      nameEn: row.name_en,
      nameCn: row.name_cn,
      sector: row.sector,
      origin: row.origin,
      size: row.company_size,
      needs: row.needs,
      contact: row.contact,
      contactMeta: row.contact_meta,
      status: row.status,
      profileComplete: row.profile_complete,
      urgent: row.urgent,
      coordinator: row.coordinator,
      profileData: profileDataOrUndefined(row.profile_data),
    })),
    partnerCompanies: partnerRows.map((row) => ({
      id: row.id,
      role: "partner",
      nameEn: row.name_en,
      nameCn: row.name_cn,
      sector: row.sector,
      type: row.partner_type,
      size: row.company_size,
      offerings: row.offerings,
      contact: row.contact,
      contactMeta: row.contact_meta,
      status: row.status,
      profileComplete: row.profile_complete,
      verified: row.verified,
      attendance: row.attendance,
      arrived: row.arrived,
      profileData: profileDataOrUndefined(row.profile_data),
    })),
    matches: matchRows.map((row) => ({
      id: row.id,
      delegationId: row.delegation_company_id,
      partnerId: row.partner_company_id,
      status: row.status,
      score: row.score,
      note: row.note,
    })),
    interpreters: interpreterRows.map((row) => ({
      id: row.id,
      name: row.name,
      languages: row.languages,
      email: row.email,
      notes: row.notes,
      available: row.available,
    })),
    meetings: meetingRows.map((row) => ({
      id: row.id,
      matchId: row.match_id,
      startsAt: row.starts_at,
      duration: row.duration_minutes,
      platform: row.platform,
      link: row.link,
      interpreter: row.interpreter,
      requestedInterpreterId: row.requested_interpreter_id ?? null,
      host: row.host,
      status: row.status,
      summary: row.summary,
    })),
    deals: dealRows.map((row) => ({
      id: row.id,
      matchId: row.match_id,
      status: row.status,
      document: row.document,
      signatoryCheck: row.signatory_check,
    })),
    itinerary: itineraryRows.map((row) => ({
      id: row.id,
      day: row.day_label,
      time: row.start_time,
      activity: row.activity,
      venue: row.venue,
      escort: row.escort,
      published: row.published,
    })),
    siteVisits: siteVisitRows.map((row) => ({
      id: row.id,
      venue: row.venue,
      date: row.visit_date,
      time: row.start_time,
      driver: row.driver,
      escort: row.escort,
      status: row.status,
      notes: row.notes,
      delegationIds: siteVisitDelegationRows
        .filter((joinRow) => joinRow.site_visit_id === row.id)
        .map((joinRow) => joinRow.delegation_company_id),
    })),
    liaison: liaisonRows.map((row) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      organisation: row.organisation,
      status: row.status,
      protocol: row.protocol,
    })),
    notifications: notificationRows.map((row) => row.message),
    announcements:
      announcementRows.length > 0
        ? announcementRows.map((row) => ({
            id: row.id,
            title: row.title,
            message: row.message,
            target: row.target,
            channel: row.channel,
            status: row.status,
            sentAt: row.sent_at,
            createdBy: row.created_by,
          }))
        : seedDb.announcements,
    resources:
      resourceRows.length > 0
        ? resourceRows.map((row) => ({
            id: row.id,
            title: row.title,
            category: row.category,
            fileName: row.file_name,
            fileUrl: row.file_url,
            storagePath: row.storage_path,
            audience: row.audience,
            visibleToDelegation: row.visible_to_delegation,
            notes: row.notes,
            updatedAt: row.updated_at,
          }))
        : seedDb.resources,
  }
}

export async function getProtectedPortalData(
  locale: Locale,
  expectedRole: AppRole | AppRole[]
) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const authorization = await validateAuthenticatedUser(supabase, user)

  if (!authorization.ok) {
    redirect(`/${locale}/unauthorized`)
  }

  const allowedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole]

  if (!allowedRoles.includes(authorization.identity.role)) {
    redirect(getRolePortalPath(locale, authorization.identity.role))
  }

  return {
    db: await loadPlexusDb(supabase),
    session: authorization.identity satisfies PortalSession,
  }
}

export async function getLoginRedirect(locale: Locale) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const authorization = await validateAuthenticatedUser(supabase, user)

  if (authorization.ok) {
    redirect(getRolePortalPath(locale, authorization.identity.role))
  }
}

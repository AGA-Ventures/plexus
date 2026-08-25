"use server"

import { after } from "next/server"
import { z } from "zod"

import type { AppRole } from "@/lib/auth"
import { validateAuthenticatedUser } from "@/lib/authorization"
import { registrationProfileSchema } from "@/lib/company-profile"
import { buildCompanyProfilePersistence } from "@/lib/company-profile-persistence"
import {
  getTenantEmailRecipients,
  renderPlexusEmail,
  sendTrackedDealActivityEmail,
  sendTrackedEmails,
  sendTrackedMatchActivityEmail,
  sendTrackedMeetingActivityEmail,
  sendTrackedTenantActivityEmail,
  sendTrackedVendorActivityEmail,
} from "@/lib/email-delivery-service"
import { isPlaceholderIndustrySector } from "@/lib/industry-sectors"
import {
  buildVendorAcceptanceUpdate,
  buildVendorAcceptanceWithdrawalUpdate,
  canScheduleAcceptedMatchMeeting,
  isFutureMeeting,
} from "@/lib/match-acceptance"
import { matchNoteFromScore, scoreMatch } from "@/lib/matching"
import {
  isMeetingSlotAvailable,
  normalizeMeetingAvailability,
} from "@/lib/meeting-availability"
import {
  createMeeting,
  meetingProviders,
  type MeetingProvider,
} from "@/lib/meetings"
import {
  type MeetingAmendmentInput,
  type ManualMeetingInput,
  validateMeetingAmendmentInput,
  validateManualMeetingInput,
} from "@/lib/manual-meeting"
import { loadPlexusDb } from "@/lib/plexus-data"
import type {
  Announcement,
  AnnouncementChannel,
  AnnouncementTarget,
  Deal,
  DelegationCompany,
  EventResource,
  LocalDb,
  MatchStatus,
  PartnerCompany,
} from "@/lib/local-db"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type ActionResult =
  | { ok: true; db: LocalDb; warning?: string }
  | { ok: false; error: string }

const uuidSchema = z.uuid()
const delegationStatusSchema = z.enum([
  "Onboarded",
  "Invited",
  "Incomplete",
  "Locked",
])
const partnerStatusSchema = z.enum([
  "Sourced",
  "Invited",
  "Confirmed",
  "Declined",
])
const partnerTypeSchema = z.enum(["Government", "Association", "Enterprise"])
const verifiedSchema = z.enum(["Verified", "Pending", "Flagged"])
const attendanceSchema = z.enum(["Invited", "Confirmed", "Declined", "Arrived"])
const industrySectorSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .refine(
    (value) => !isPlaceholderIndustrySector(value),
    "Select an industry sector."
  )
const matchStatusSchema = z.enum([
  "Proposed",
  "Accepted",
  "Rejected",
  "Session Scheduled",
])
const dealStatusSchema = z.enum([
  "Under Discussion",
  "Agreement Reached",
  "Signed",
  "Failed",
])
const announcementTargetSchema = z.enum([
  "all",
  "delegation",
  "partner",
  "admin",
])
const announcementChannelSchema = z.enum(["email", "notification", "both"])
const resourceAudienceSchema = z.enum(["all", "delegation", "partner", "admin"])
const resourceCategorySchema = z.enum([
  "Agenda",
  "Map",
  "Briefing",
  "Logistics",
  "Other",
])
const meetingSlotSchema = z.iso.datetime({ offset: true })
const delegationCompanySchema = z.object({
  id: z.string(),
  role: z.literal("delegation"),
  nameEn: z.string().trim().min(1),
  nameCn: z.string().trim().min(1),
  sector: industrySectorSchema,
  origin: z.string().trim().min(1),
  size: z.string().trim().min(1),
  needs: z.string().trim().min(1),
  contact: z.string().trim().min(1),
  contactMeta: z.string().trim().min(1),
  status: delegationStatusSchema,
  profileComplete: z.number().int().min(0).max(100),
  urgent: z.boolean(),
  coordinator: z.string().trim().min(1),
  profileData: registrationProfileSchema.optional(),
})

const partnerCompanySchema = z.object({
  id: z.string(),
  role: z.literal("partner"),
  nameEn: z.string().trim().min(1),
  nameCn: z.string().trim().min(1),
  sector: industrySectorSchema,
  type: partnerTypeSchema,
  size: z.string().trim().min(1),
  offerings: z.string().trim().min(1),
  contact: z.string().trim().min(1),
  contactMeta: z.string().trim().min(1),
  status: partnerStatusSchema,
  profileComplete: z.number().int().min(0).max(100),
  verified: verifiedSchema,
  attendance: attendanceSchema,
  arrived: z.boolean(),
  profileData: registrationProfileSchema.optional(),
})

const managedCompanySchema = z.discriminatedUnion("role", [
  delegationCompanySchema,
  partnerCompanySchema,
])

async function runMutation(
  operation: Parameters<typeof withSession>[0],
  options?: { role?: AppRole }
): Promise<ActionResult> {
  return withSession(operation, options)
}

async function withSession(
  operation: (
    context: Awaited<ReturnType<typeof createActionContext>>
  ) => Promise<{
    error?: { message: string } | null
    warning?: string
  } | void>,
  options?: { role?: AppRole }
): Promise<ActionResult> {
  const context = await createActionContext()

  if (!context.userRole) {
    return { ok: false, error: "Your account is missing app_metadata.role." }
  }

  if (
    options?.role &&
    context.userRole !== options.role &&
    context.userRole !== "superadmin"
  ) {
    return {
      ok: false,
      error: "You do not have permission to perform this action.",
    }
  }

  const result = await operation(context)

  if (result?.error) {
    return { ok: false, error: result.error.message }
  }

  const db = await loadPlexusDb(context.supabase)

  return result?.warning
    ? { ok: true, db, warning: result.warning }
    : { ok: true, db }
}

async function createActionContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error(error?.message ?? "You must be logged in.")
  }

  const authorization = await validateAuthenticatedUser(supabase, user)

  if (!authorization.ok) {
    throw new Error(authorization.error)
  }

  return {
    supabase,
    identity: authorization.identity,
    userRole: authorization.identity.role,
  }
}

export async function refreshPortalDbAction(): Promise<ActionResult> {
  try {
    const context = await createActionContext()

    return { ok: true, db: await loadPlexusDb(context.supabase) }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "The live workspace data could not be refreshed.",
    }
  }
}

function toDelegationPayload(company: DelegationCompany) {
  return {
    name_en: company.nameEn,
    name_cn: company.nameCn,
    sector: company.sector,
    origin: company.origin,
    company_size: company.size,
    needs: company.needs,
    contact: company.contact,
    contact_meta: company.contactMeta,
    status: company.status,
    profile_complete: company.profileComplete,
    urgent: company.urgent,
    coordinator: company.coordinator,
    profile_data: company.profileData ?? {},
  }
}

function toPartnerPayload(company: PartnerCompany) {
  return {
    name_en: company.nameEn,
    name_cn: company.nameCn,
    sector: company.sector,
    partner_type: company.type,
    company_size: company.size,
    offerings: company.offerings,
    contact: company.contact,
    contact_meta: company.contactMeta,
    status: company.status,
    profile_complete: company.profileComplete,
    verified: company.verified,
    attendance: company.attendance,
    arrived: company.arrived,
    profile_data: company.profileData ?? {},
  }
}

function isUuid(value: string) {
  return uuidSchema.safeParse(value).success
}

export async function createCompanyAction(
  values: unknown
): Promise<ActionResult> {
  const parsed = managedCompanySchema.safeParse(values)

  if (!parsed.success) {
    return { ok: false, error: "Check the company fields and try again." }
  }

  return runMutation(
    async ({ supabase }) => {
      if (parsed.data.role === "delegation") {
        const payload = toDelegationPayload(parsed.data)
        const insertPayload: Record<string, unknown> = isUuid(parsed.data.id)
          ? { id: parsed.data.id, ...payload }
          : payload

        return supabase.from("delegation_companies").insert(insertPayload)
      }

      const payload = toPartnerPayload(parsed.data)
      const insertPayload: Record<string, unknown> = isUuid(parsed.data.id)
        ? { id: parsed.data.id, ...payload }
        : payload

      return supabase.from("partner_companies").insert(insertPayload)
    },
    { role: "admin" }
  )
}

export async function updateCompanyAction(
  values: unknown
): Promise<ActionResult> {
  const parsed = managedCompanySchema.safeParse(values)

  if (!parsed.success || !isUuid(parsed.data.id)) {
    return { ok: false, error: "Check the company fields and try again." }
  }

  return runMutation(async ({ supabase }) => {
    if (parsed.data.role === "delegation") {
      return supabase
        .from("delegation_companies")
        .update(toDelegationPayload(parsed.data))
        .eq("id", parsed.data.id)
    }

    return supabase
      .from("partner_companies")
      .update(toPartnerPayload(parsed.data))
      .eq("id", parsed.data.id)
  })
}

export async function deleteCompanyAction(
  kind: "delegation" | "partner",
  id: string
): Promise<ActionResult> {
  if (!isUuid(id)) {
    return { ok: false, error: "Invalid company id." }
  }

  return runMutation(
    async ({ supabase }) =>
      kind === "delegation"
        ? await supabase.from("delegation_companies").delete().eq("id", id)
        : await supabase.from("partner_companies").delete().eq("id", id),
    { role: "admin" }
  )
}

export async function addMatchAction(
  delegationId: string,
  partnerId: string
): Promise<ActionResult> {
  if (!isUuid(delegationId) || !isUuid(partnerId)) {
    return {
      ok: false,
      error: "Select valid companies before creating a match.",
    }
  }

  return runMutation(
    async ({ supabase }) => {
      const [delegationResult, partnerResult] = await Promise.all([
        supabase
          .from("delegation_companies")
          .select("sector, needs, profile_complete")
          .eq("id", delegationId)
          .single(),
        supabase
          .from("partner_companies")
          .select("sector, offerings, verified, profile_complete")
          .eq("id", partnerId)
          .single(),
      ])

      if (delegationResult.error) {
        return delegationResult
      }
      if (partnerResult.error) {
        return partnerResult
      }

      const result = scoreMatch({
        delegation: {
          sector: delegationResult.data.sector,
          needs: delegationResult.data.needs,
          profileComplete: delegationResult.data.profile_complete,
        },
        partner: {
          sector: partnerResult.data.sector,
          offerings: partnerResult.data.offerings,
          verified: partnerResult.data.verified,
          profileComplete: partnerResult.data.profile_complete,
        },
      })

      return supabase.from("matches").insert({
        delegation_company_id: delegationId,
        partner_company_id: partnerId,
        status: "Proposed",
        score: result.score,
        note: matchNoteFromScore(result),
      })
    },
    { role: "admin" }
  )
}

export async function createManualMeetingAction(
  input: ManualMeetingInput
): Promise<ActionResult> {
  const parsed = validateManualMeetingInput(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      if (!identity.adminId) {
        return {
          error: {
            message:
              "Manual meetings require an Admin account bound to a tenant.",
          },
        }
      }

      const { delegationId, partnerId } = parsed.data
      const [delegationResult, partnerResult] = await Promise.all([
        supabase
          .from("delegation_companies")
          .select("id, name_en, sector, needs, profile_complete")
          .eq("id", delegationId)
          .eq("admin_id", identity.adminId)
          .maybeSingle(),
        supabase
          .from("partner_companies")
          .select("id, name_en, sector, offerings, verified, profile_complete")
          .eq("id", partnerId)
          .eq("admin_id", identity.adminId)
          .maybeSingle(),
      ])

      if (
        delegationResult.error ||
        partnerResult.error ||
        !delegationResult.data ||
        !partnerResult.data
      ) {
        return {
          error: {
            message:
              "Both selected Vendors must belong to your Admin workspace.",
          },
        }
      }

      let interpreter:
        | { id: string; name: string; languages: string }
        | undefined

      if (parsed.data.requestedInterpreterId) {
        const interpreterResult = await supabase
          .from("interpreters")
          .select("id, name, languages")
          .eq("id", parsed.data.requestedInterpreterId)
          .eq("admin_id", identity.adminId)
          .eq("available", true)
          .maybeSingle()

        if (interpreterResult.error || !interpreterResult.data) {
          return {
            error: {
              message:
                "The selected interpreter is no longer available in this workspace.",
            },
          }
        }

        interpreter = interpreterResult.data
      }

      const existingMatchResult = await supabase
        .from("matches")
        .select("id, status")
        .eq("delegation_company_id", delegationId)
        .eq("partner_company_id", partnerId)
        .eq("admin_id", identity.adminId)
        .maybeSingle()

      if (existingMatchResult.error) {
        return {
          error: { message: "Unable to check the selected Vendor pair." },
        }
      }

      if (existingMatchResult.data?.status === "Rejected") {
        return {
          error: {
            message:
              "This Vendor pair rejected its match. Reopen the match before scheduling a meeting.",
          },
        }
      }

      let matchId = existingMatchResult.data?.id

      if (!matchId) {
        const score = scoreMatch({
          delegation: {
            sector: delegationResult.data.sector,
            needs: delegationResult.data.needs,
            profileComplete: delegationResult.data.profile_complete,
          },
          partner: {
            sector: partnerResult.data.sector,
            offerings: partnerResult.data.offerings,
            verified: partnerResult.data.verified,
            profileComplete: partnerResult.data.profile_complete,
          },
        })
        const matchResult = await supabase
          .from("matches")
          .insert({
            admin_id: identity.adminId,
            delegation_company_id: delegationId,
            partner_company_id: partnerId,
            status: "Proposed",
            score: score.score,
            note: `Manually paired by the tenant Admin for a scheduled meeting. ${matchNoteFromScore(score)}`,
          })
          .select("id")
          .single()

        if (matchResult.error || !matchResult.data) {
          return {
            error: {
              message: "Unable to create the match for this meeting.",
            },
          }
        }

        matchId = matchResult.data.id
      }

      const duplicateResult = await supabase
        .from("meetings")
        .select("id")
        .eq("match_id", matchId)
        .eq("admin_id", identity.adminId)
        .eq("starts_at", parsed.data.startsAt)
        .limit(1)

      if (duplicateResult.error) {
        return {
          error: { message: "Unable to check the meeting calendar." },
        }
      }

      if ((duplicateResult.data ?? []).length > 0) {
        return {
          error: {
            message:
              "This Vendor pair already has a meeting at the selected time.",
          },
        }
      }

      const interpreterLabel = interpreter
        ? `${interpreter.name} · ${interpreter.languages}`
        : "To be confirmed"
      const summary = [
        `Admin-arranged meeting between ${delegationResult.data.name_en} and ${partnerResult.data.name_en}.`,
        `Preferred provider: ${parsed.data.platform === "zoom" ? "Zoom" : "Lark"}.`,
        `Agenda: ${parsed.data.agenda}`,
        "The tenant Admin authorized the protected provider link directly.",
      ].join(" ")

      const meetingResult = await supabase
        .from("meetings")
        .insert({
          admin_id: identity.adminId,
          match_id: matchId,
          starts_at: parsed.data.startsAt,
          duration_minutes: parsed.data.durationMinutes,
          platform: parsed.data.platform === "zoom" ? "Zoom" : "Lark",
          link: "",
          interpreter: interpreterLabel,
          requested_interpreter_id: interpreter?.id ?? null,
          host: identity.displayName,
          status: "Scheduled",
          summary,
        })
        .select("id")
        .single()

      if (meetingResult.error || !meetingResult.data) {
        return {
          error: { message: "Unable to add the meeting to the calendar." },
        }
      }

      after(() =>
        sendTrackedMeetingActivityEmail({
          meetingId: meetingResult.data.id,
          actor: {
            type: "admin",
            userId: identity.userId,
            name: identity.displayName,
          },
          subject: "An Admin arranged your Plexus meeting",
          text: `Your meeting is scheduled for ${new Intl.DateTimeFormat(
            "en-MY",
            {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kuala_Lumpur",
            }
          ).format(
            new Date(parsed.data.startsAt)
          )}. Sign in to review the latest meeting details.`,
          source: {
            table: "meetings",
            id: meetingResult.data.id,
          },
          includeAdmins: true,
        })
      )

      // An Admin who arranges the meeting is the scheduling authority, so the
      // protected link is issued now instead of waiting for mutual acceptance.
      try {
        await createMeeting({
          matchId,
          adminId: identity.adminId,
          meetingId: meetingResult.data.id,
          provider: parsed.data.platform,
          topic: `${delegationResult.data.name_en} ↔ ${partnerResult.data.name_en}`,
          durationMinutes: parsed.data.durationMinutes,
          startsAt: new Date(parsed.data.startsAt),
          allowWithoutMutualAcceptance: true,
          summary,
        })
      } catch (error) {
        return {
          warning: `The meeting is on both calendars, but the protected ${
            parsed.data.platform === "zoom" ? "Zoom" : "Lark"
          } link could not be created: ${
            error instanceof Error
              ? error.message
              : "the meeting provider is unavailable."
          }`,
        }
      }
    },
    { role: "admin" }
  )
}

export async function updateMeetingAction(
  input: MeetingAmendmentInput
): Promise<ActionResult> {
  const parsed = validateMeetingAmendmentInput(input)

  if (!parsed.success) {
    return { ok: false, error: parsed.error }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      if (!identity.adminId) {
        return {
          error: {
            message:
              "Meeting changes require an Admin account bound to a tenant.",
          },
        }
      }

      const meetingResult = await supabase
        .from("meetings")
        .select(
          "id, match_id, starts_at, duration_minutes, platform, link, status"
        )
        .eq("id", parsed.data.meetingId)
        .eq("admin_id", identity.adminId)
        .maybeSingle()

      if (meetingResult.error || !meetingResult.data) {
        return {
          error: {
            message: "This meeting is not available in your Admin workspace.",
          },
        }
      }

      if (["Completed", "Cancelled"].includes(meetingResult.data.status)) {
        return {
          error: {
            message: "Completed or cancelled meetings cannot be amended.",
          },
        }
      }

      let interpreter:
        | { id: string; name: string; languages: string }
        | undefined

      if (parsed.data.requestedInterpreterId) {
        const interpreterResult = await supabase
          .from("interpreters")
          .select("id, name, languages")
          .eq("id", parsed.data.requestedInterpreterId)
          .eq("admin_id", identity.adminId)
          .eq("available", true)
          .maybeSingle()

        if (interpreterResult.error || !interpreterResult.data) {
          return {
            error: {
              message:
                "The selected interpreter is no longer available in this workspace.",
            },
          }
        }

        interpreter = interpreterResult.data
      }

      const platform = parsed.data.platform === "zoom" ? "Zoom" : "Lark"
      const scheduleChanged =
        new Date(meetingResult.data.starts_at).getTime() !==
          new Date(parsed.data.startsAt).getTime() ||
        meetingResult.data.duration_minutes !== parsed.data.durationMinutes ||
        meetingResult.data.platform !== platform

      const needsReprovision =
        Boolean(meetingResult.data.link) && scheduleChanged

      const duplicateResult = await supabase
        .from("meetings")
        .select("id")
        .eq("match_id", meetingResult.data.match_id)
        .eq("admin_id", identity.adminId)
        .eq("starts_at", parsed.data.startsAt)
        .neq("id", parsed.data.meetingId)
        .limit(1)

      if (duplicateResult.error) {
        return {
          error: { message: "Unable to check the meeting calendar." },
        }
      }

      if ((duplicateResult.data ?? []).length > 0) {
        return {
          error: {
            message:
              "This Vendor pair already has a meeting at the selected time.",
          },
        }
      }

      const interpreterLabel = interpreter
        ? `${interpreter.name} · ${interpreter.languages}`
        : "To be confirmed"
      const summary = [
        "Admin-amended meeting.",
        `Preferred provider: ${platform}.`,
        `Agenda: ${parsed.data.agenda}`,
        needsReprovision
          ? "A fresh protected provider link replaced the previous one."
          : meetingResult.data.link
            ? "Protected provider link retained."
            : "The calendar slot is confirmed; a protected Zoom or Lark link remains unavailable until both Vendors accept the match.",
      ].join(" ")
      const notifyMeetingUpdate = () => {
        after(() =>
          sendTrackedMeetingActivityEmail({
            meetingId: parsed.data.meetingId,
            actor: {
              type: "admin",
              userId: identity.userId,
              name: identity.displayName,
            },
            subject: "Your Plexus meeting was updated",
            text: `The Admin updated your meeting to ${new Intl.DateTimeFormat(
              "en-MY",
              {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Kuala_Lumpur",
              }
            ).format(
              new Date(parsed.data.startsAt)
            )}. Sign in to review the latest provider, interpreter, and schedule details.`,
            source: {
              table: "meetings",
              id: parsed.data.meetingId,
            },
            includeAdmins: true,
          })
        )
      }

      // Rescheduling a provider-backed meeting books a new provider meeting and
      // retires the previous protected link, so the old join URL cannot outlive
      // the schedule it was issued for.
      if (needsReprovision) {
        try {
          await createMeeting({
            matchId: meetingResult.data.match_id,
            adminId: identity.adminId,
            meetingId: meetingResult.data.id,
            provider: parsed.data.platform,
            topic: "Plexus business matching meeting",
            durationMinutes: parsed.data.durationMinutes,
            startsAt: new Date(parsed.data.startsAt),
            allowWithoutMutualAcceptance: true,
            replaceExistingLink: true,
            summary,
          })
        } catch (error) {
          return {
            error: {
              message: `The ${platform} meeting could not be rescheduled: ${
                error instanceof Error
                  ? error.message
                  : "the meeting provider is unavailable."
              }`,
            },
          }
        }

        const updateResult = await supabase
          .from("meetings")
          .update({
            interpreter: interpreterLabel,
            requested_interpreter_id: interpreter?.id ?? null,
          })
          .eq("id", parsed.data.meetingId)
          .eq("admin_id", identity.adminId)

        if (!updateResult.error) notifyMeetingUpdate()

        return updateResult
      }

      const updateResult = await supabase
        .from("meetings")
        .update({
          starts_at: parsed.data.startsAt,
          duration_minutes: parsed.data.durationMinutes,
          platform,
          interpreter: interpreterLabel,
          requested_interpreter_id: interpreter?.id ?? null,
          summary,
        })
        .eq("id", parsed.data.meetingId)
        .eq("admin_id", identity.adminId)

      if (!updateResult.error) notifyMeetingUpdate()

      return updateResult
    },
    { role: "admin" }
  )
}

type MatchCandidateRow = {
  id: string
  name_en: string
  name_cn: string
  sector: string
}

export async function requestMatchAction(
  counterpartId: string
): Promise<ActionResult> {
  if (!isUuid(counterpartId)) {
    return { ok: false, error: "Select a valid company to match." }
  }

  return runMutation(async ({ supabase, identity, userRole }) => {
    if (
      userRole !== "vendor" ||
      !identity.vendorType ||
      !identity.vendorCompanyId
    ) {
      return {
        error: {
          message: "Only linked Vendor accounts can request matches.",
        },
      }
    }

    // Confirm the counterpart is on the opposite side and visible through the
    // name+sector-only discovery function (no other columns are exposed).
    const candidatesResult = await supabase.rpc("match_candidates")

    if (candidatesResult.error) {
      return candidatesResult
    }

    const candidates = (candidatesResult.data ?? []) as MatchCandidateRow[]
    const candidate = candidates.find((row) => row.id === counterpartId)

    if (!candidate) {
      return { error: { message: "That company is not available to match." } }
    }

    let delegationId: string
    let partnerId: string
    let scoreInput: Parameters<typeof scoreMatch>[0]

    if (identity.vendorType === "delegation") {
      delegationId = identity.vendorCompanyId
      partnerId = counterpartId

      const ownResult = await supabase
        .from("delegation_companies")
        .select("sector, needs, profile_complete")
        .eq("id", delegationId)
        .single()

      if (ownResult.error) {
        return ownResult
      }

      scoreInput = {
        delegation: {
          sector: ownResult.data.sector,
          needs: ownResult.data.needs,
          profileComplete: ownResult.data.profile_complete,
        },
        partner: {
          sector: candidate.sector,
          offerings: "",
          verified: "Pending",
          profileComplete: 0,
        },
      }
    } else {
      partnerId = identity.vendorCompanyId
      delegationId = counterpartId

      const ownResult = await supabase
        .from("partner_companies")
        .select("sector, offerings, verified, profile_complete")
        .eq("id", partnerId)
        .single()

      if (ownResult.error) {
        return ownResult
      }

      scoreInput = {
        delegation: {
          sector: candidate.sector,
          needs: "",
          profileComplete: 0,
        },
        partner: {
          sector: ownResult.data.sector,
          offerings: ownResult.data.offerings,
          verified: ownResult.data.verified,
          profileComplete: ownResult.data.profile_complete,
        },
      }
    }

    const existing = await supabase
      .from("matches")
      .select("id")
      .eq("delegation_company_id", delegationId)
      .eq("partner_company_id", partnerId)
      .limit(1)

    if (existing.error) {
      return existing
    }

    if ((existing.data ?? []).length > 0) {
      return {
        error: { message: "You have already matched with this company." },
      }
    }

    const result = scoreMatch(scoreInput)

    const insertResult = await supabase
      .from("matches")
      .insert({
        delegation_company_id: delegationId,
        partner_company_id: partnerId,
        status: "Proposed",
        score: result.score,
        note: `Self-requested by ${identity.vendorType} Vendor. ${matchNoteFromScore(result)}`,
      })
      .select("id")
      .single()

    if (!insertResult.error) {
      after(() =>
        sendTrackedMatchActivityEmail({
          matchId: insertResult.data.id,
          actor: {
            type: "vendor",
            userId: identity.userId,
            name: identity.displayName,
          },
          trigger: "match_activity",
          subject: "A new Plexus match was requested",
          text: `${identity.displayName} requested a business match. Sign in to review the matched company and record your decision.`,
          source: {
            table: "matches",
            id: insertResult.data.id,
          },
          includeAdmins: true,
        })
      )
    }

    return insertResult
  })
}

export async function updateMatchStatusAction(
  matchId: string,
  status: MatchStatus
): Promise<ActionResult> {
  const parsed = matchStatusSchema.safeParse(status)

  if (!isUuid(matchId) || !parsed.success) {
    return { ok: false, error: "Invalid match status update." }
  }

  return runMutation(async ({ supabase, identity, userRole }) => {
    if (userRole === "vendor") {
      if (!["Accepted", "Proposed"].includes(parsed.data)) {
        return {
          error: {
            message: "Vendors can only accept or unaccept a match.",
          },
        }
      }

      if (parsed.data === "Proposed") {
        const withdrawalResult = await supabase
          .from("matches")
          .update(buildVendorAcceptanceWithdrawalUpdate(identity.vendorType!))
          .eq("id", matchId)
          .select(
            "id, admin_id, status, delegation_accepted_at, partner_accepted_at"
          )
          .maybeSingle()

        if (withdrawalResult.error) {
          return withdrawalResult
        }

        if (!withdrawalResult.data) {
          return {
            error: {
              message: "The selected match is not available to this Vendor.",
            },
          }
        }

        after(() =>
          sendTrackedMatchActivityEmail({
            matchId,
            actor: {
              type: "vendor",
              userId: identity.userId,
              name: identity.displayName,
            },
            trigger: "match_activity",
            subject: "A Plexus match acceptance was withdrawn",
            text: `${identity.displayName} withdrew its acceptance before the counterparty completed the match decision.`,
            source: {
              table: "matches",
              id: matchId,
            },
            includeAdmins: true,
          })
        )

        return withdrawalResult
      }

      const decisionResult = await supabase
        .from("matches")
        // Reopen legacy rows left in Rejected by the removed Vendor
        // "Request change" flow. The database trigger derives Accepted only
        // after the counterparty has also accepted.
        .update(
          buildVendorAcceptanceUpdate(
            identity.vendorType!,
            new Date().toISOString()
          )
        )
        .eq("id", matchId)
        .select(
          "id, admin_id, status, delegation_accepted_at, partner_accepted_at"
        )
        .maybeSingle()

      if (decisionResult.error) {
        return decisionResult
      }

      const match = decisionResult.data

      if (!match) {
        return {
          error: {
            message: "The selected match is not available to this Vendor.",
          },
        }
      }

      after(() =>
        sendTrackedMatchActivityEmail({
          matchId,
          actor: {
            type: "vendor",
            userId: identity.userId,
            name: identity.displayName,
          },
          trigger: "match_activity",
          subject:
            match.status === "Accepted"
              ? "Both Vendors accepted the Plexus match"
              : "A Vendor accepted the Plexus match",
          text:
            match.status === "Accepted"
              ? "Both matched Vendors have accepted. A Vendor can now propose an available meeting time."
              : `${identity.displayName} accepted the match. The counterparty decision is still pending.`,
          source: {
            table: "matches",
            id: matchId,
          },
          includeAdmins: true,
        })
      )

      return decisionResult
    }

    if (["Accepted", "Session Scheduled"].includes(parsed.data)) {
      return {
        error: {
          message:
            parsed.data === "Accepted"
              ? "Each Vendor must record its own acceptance."
              : "Create the protected provider meeting to schedule the session.",
        },
      }
    }

    const updateResult = await supabase
      .from("matches")
      .update({
        status: parsed.data,
        ...(parsed.data === "Proposed" || parsed.data === "Rejected"
          ? {
              delegation_accepted_at: null,
              partner_accepted_at: null,
            }
          : {}),
      })
      .eq("id", matchId)
      .select("id")
      .single()

    if (!updateResult.error) {
      after(() =>
        sendTrackedMatchActivityEmail({
          matchId,
          actor: {
            type: userRole === "superadmin" ? "superadmin" : "admin",
            userId: identity.userId,
            name: identity.displayName,
          },
          trigger: "match_activity",
          subject: `Plexus match status: ${parsed.data}`,
          text: `${identity.displayName} changed the match status to ${parsed.data}. Sign in to review the latest match details.`,
          source: {
            table: "matches",
            id: matchId,
          },
          includeAdmins: true,
        })
      )
    }

    return updateResult
  })
}

export async function proposeMeetingAction(
  matchId: string,
  requestedSlot: string,
  requestedInterpreterId?: string | null
): Promise<ActionResult> {
  const parsedSlot = meetingSlotSchema.safeParse(requestedSlot)
  const parsedInterpreter = z
    .union([uuidSchema, z.null()])
    .optional()
    .safeParse(requestedInterpreterId)

  if (!isUuid(matchId) || !parsedSlot.success || !parsedInterpreter.success) {
    return {
      ok: false,
      error: "Select an available meeting date and time.",
    }
  }

  const interpreterId = parsedInterpreter.data ?? null
  const meetingSlot = parsedSlot.data

  return runMutation(
    async ({ supabase, identity, userRole }) => {
      if (
        userRole !== "vendor" ||
        !identity.vendorType ||
        !identity.vendorCompanyId
      ) {
        return {
          error: {
            message: "Only a matched Vendor can propose a meeting time.",
          },
        }
      }

      const matchResult = await supabase
        .from("matches")
        .select(
          "admin_id, delegation_company_id, partner_company_id, status, delegation_accepted_at, partner_accepted_at"
        )
        .eq("id", matchId)
        .single()

      if (matchResult.error) {
        return matchResult
      }

      const match = matchResult.data
      const participatesInMatch =
        (identity.vendorType === "delegation" &&
          identity.vendorCompanyId === match.delegation_company_id) ||
        (identity.vendorType === "partner" &&
          identity.vendorCompanyId === match.partner_company_id)

      if (!participatesInMatch) {
        return {
          error: {
            message: "You can only propose meetings for your own matches.",
          },
        }
      }

      const availabilityResult = await supabase
        .from("admin_tenants")
        .select("meeting_availability")
        .eq("id", match.admin_id)
        .single()

      if (availabilityResult.error || !availabilityResult.data) {
        return {
          error: {
            message: "The Admin's meeting availability could not be loaded.",
          },
        }
      }

      const availability = normalizeMeetingAvailability(
        availabilityResult.data.meeting_availability
      )

      if (!isMeetingSlotAvailable(meetingSlot, availability)) {
        return {
          error: {
            message:
              "That meeting time is no longer available. Choose another open date and time.",
          },
        }
      }

      const bothAccepted = Boolean(
        match.delegation_accepted_at && match.partner_accepted_at
      )

      if (!bothAccepted) {
        return {
          error: {
            message: "Both Vendors must accept before proposing a meeting.",
          },
        }
      }

      const [activeMeetingsResult, pendingProposalResult] = await Promise.all([
        supabase
          .from("meetings")
          .select("id, starts_at, duration_minutes, status")
          .eq("match_id", matchId)
          .in("status", ["Scheduled", "Live"]),
        supabase
          .from("meeting_proposals")
          .select("id")
          .eq("match_id", matchId)
          .eq("status", "pending")
          .maybeSingle(),
      ])

      if (activeMeetingsResult.error) {
        return activeMeetingsResult
      }

      if (pendingProposalResult.error) {
        return pendingProposalResult
      }

      if (pendingProposalResult.data) {
        return {
          error: {
            message:
              "A meeting time is already awaiting Vendor approval for this match.",
          },
        }
      }

      const futureMeetingExists = (activeMeetingsResult.data ?? []).some(
        (meeting) =>
          isFutureMeeting({
            startsAt: meeting.starts_at,
            durationMinutes: meeting.duration_minutes,
            status: meeting.status,
          })
      )

      if (
        !canScheduleAcceptedMatchMeeting({
          bothAccepted,
          matchStatus: match.status,
          futureMeetingExists,
        })
      ) {
        return {
          error: {
            message: futureMeetingExists
              ? "A future meeting is already scheduled. Open My Meetings to view it."
              : "This accepted match is not ready for a meeting proposal.",
          },
        }
      }

      if (interpreterId) {
        const interpreterResult = await supabase
          .from("interpreters")
          .select("available")
          .eq("id", interpreterId)
          .single()

        if (interpreterResult.error || !interpreterResult.data.available) {
          return {
            error: {
              message: "The selected interpreter is no longer available.",
            },
          }
        }
      }

      const proposalResult = await supabase
        .from("meeting_proposals")
        .insert({
          match_id: matchId,
          starts_at: meetingSlot,
          duration_minutes: 60,
          requested_interpreter_id: interpreterId,
        })
        .select("id")
        .single()

      if (!proposalResult.error) {
        const proposedTime = new Intl.DateTimeFormat("en-MY", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Kuala_Lumpur",
        }).format(new Date(meetingSlot))

        after(() =>
          sendTrackedMatchActivityEmail({
            matchId,
            actor: {
              type: "vendor",
              userId: identity.userId,
              name: identity.displayName,
            },
            trigger: "meeting_activity",
            subject: "A meeting time is awaiting Vendor approval",
            text: `${identity.displayName} proposed ${proposedTime}. The matched counterparty must approve this exact time before Plexus creates the meeting.`,
            source: {
              table: "meeting_proposals",
              id: proposalResult.data.id,
            },
            includeAdmins: true,
          })
        )
      }

      return proposalResult
    },
    { role: "vendor" }
  )
}

export async function approveMeetingProposalAction(
  proposalId: string
): Promise<ActionResult> {
  if (!isUuid(proposalId)) {
    return { ok: false, error: "Invalid meeting proposal." }
  }

  return runMutation(
    async ({ supabase, identity, userRole }) => {
      if (
        userRole !== "vendor" ||
        !identity.vendorType ||
        !identity.vendorCompanyId
      ) {
        return {
          error: {
            message: "Only a matched Vendor can approve a meeting time.",
          },
        }
      }

      const proposalResult = await supabase
        .from("meeting_proposals")
        .select(
          "id, admin_id, match_id, starts_at, status, delegation_approved_at, partner_approved_at"
        )
        .eq("id", proposalId)
        .maybeSingle()

      if (proposalResult.error || !proposalResult.data) {
        return {
          error: { message: "The meeting proposal is no longer available." },
        }
      }

      const proposal = proposalResult.data

      if (proposal.status !== "pending") {
        return {
          error: { message: "This meeting proposal is no longer pending." },
        }
      }

      const matchResult = await supabase
        .from("matches")
        .select("delegation_company_id, partner_company_id")
        .eq("id", proposal.match_id)
        .eq("admin_id", proposal.admin_id)
        .maybeSingle()

      if (matchResult.error || !matchResult.data) {
        return {
          error: { message: "The matched companies could not be verified." },
        }
      }

      const participatesInMatch =
        (identity.vendorType === "delegation" &&
          identity.vendorCompanyId ===
            matchResult.data.delegation_company_id) ||
        (identity.vendorType === "partner" &&
          identity.vendorCompanyId === matchResult.data.partner_company_id)

      if (!participatesInMatch) {
        return {
          error: {
            message: "You can only approve meetings for your own matches.",
          },
        }
      }

      const ownApproval =
        identity.vendorType === "delegation"
          ? proposal.delegation_approved_at
          : proposal.partner_approved_at

      if (ownApproval) {
        return {
          error: {
            message:
              "You already approved this time. Waiting for the other Vendor.",
          },
        }
      }

      const availabilityResult = await supabase
        .from("admin_tenants")
        .select("meeting_availability")
        .eq("id", proposal.admin_id)
        .single()

      if (
        availabilityResult.error ||
        !availabilityResult.data ||
        !isMeetingSlotAvailable(
          proposal.starts_at,
          normalizeMeetingAvailability(
            availabilityResult.data.meeting_availability
          )
        )
      ) {
        return {
          error: {
            message:
              "That proposed meeting time is no longer open. Ask either Vendor to choose another time.",
          },
        }
      }

      const approvedAt = new Date().toISOString()
      const approvalUpdate =
        identity.vendorType === "delegation"
          ? {
              delegation_approved_at: approvedAt,
              delegation_approved_by: identity.userId,
            }
          : {
              partner_approved_at: approvedAt,
              partner_approved_by: identity.userId,
            }

      const updateResult = await supabase
        .from("meeting_proposals")
        .update(approvalUpdate)
        .eq("id", proposalId)
        .eq("status", "pending")
        .select("id")
        .single()

      if (!updateResult.error) {
        after(() =>
          sendTrackedMatchActivityEmail({
            matchId: proposal.match_id,
            actor: {
              type: "vendor",
              userId: identity.userId,
              name: identity.displayName,
            },
            trigger: "meeting_activity",
            subject: "A Vendor approved the proposed meeting time",
            text: `${identity.displayName} approved the proposed meeting time. Sign in to see whether the counterparty approval and meeting creation are complete.`,
            source: {
              table: "meeting_proposals",
              id: proposalId,
            },
            includeAdmins: true,
          })
        )
      }

      return updateResult
    },
    { role: "vendor" }
  )
}

export async function createProviderMeetingAction(input: {
  matchId: string
  provider: MeetingProvider
}): Promise<ActionResult> {
  const parsed = z
    .object({
      matchId: uuidSchema,
      provider: z.enum(meetingProviders),
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Choose a valid match and meeting provider." }
  }

  return runMutation(
    async ({ supabase, identity, userRole }) => {
      const matchResult = await supabase
        .from("matches")
        .select(
          "id, admin_id, status, delegation_accepted_at, partner_accepted_at"
        )
        .eq("id", parsed.data.matchId)
        .maybeSingle()

      if (matchResult.error || !matchResult.data) {
        return {
          error: { message: "The selected match is not available." },
        }
      }

      if (
        userRole === "admin" &&
        identity.adminId !== matchResult.data.admin_id
      ) {
        return {
          error: { message: "You cannot create a meeting for this tenant." },
        }
      }

      if (
        !matchResult.data.delegation_accepted_at ||
        !matchResult.data.partner_accepted_at ||
        !["Accepted", "Session Scheduled"].includes(matchResult.data.status)
      ) {
        return {
          error: {
            message: "Both Vendors must accept before creating a meeting.",
          },
        }
      }

      const preferenceResult = await supabase
        .from("meetings")
        .select("starts_at, duration_minutes")
        .eq("match_id", parsed.data.matchId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (preferenceResult.error) {
        return {
          error: { message: "Unable to read the meeting preferences." },
        }
      }

      try {
        await createMeeting({
          matchId: parsed.data.matchId,
          adminId: matchResult.data.admin_id,
          provider: parsed.data.provider,
          topic: "Plexus business matching meeting",
          durationMinutes: preferenceResult.data?.duration_minutes ?? 60,
          startsAt: preferenceResult.data?.starts_at
            ? new Date(preferenceResult.data.starts_at)
            : undefined,
        })

        after(() =>
          sendTrackedMatchActivityEmail({
            matchId: parsed.data.matchId,
            actor: {
              type: userRole === "superadmin" ? "superadmin" : "admin",
              userId: identity.userId,
              name: identity.displayName,
            },
            trigger: "meeting_activity",
            subject: "Your Plexus meeting was created",
            text: `Plexus created the protected ${parsed.data.provider.toUpperCase()} meeting. Sign in to open the meeting from your workspace.`,
            source: {
              table: "matches",
              id: parsed.data.matchId,
            },
            includeAdmins: true,
          })
        )
      } catch (error) {
        return {
          error: {
            message:
              error instanceof Error
                ? error.message
                : "The meeting provider could not create the meeting.",
          },
        }
      }
    },
    { role: "admin" }
  )
}

export async function completeMeetingAction(
  meetingId: string
): Promise<ActionResult> {
  if (!isUuid(meetingId)) {
    return { ok: false, error: "Invalid meeting id." }
  }

  return runMutation(
    async ({ supabase, identity, userRole }) => {
      const result = await supabase.rpc("complete_meeting_with_mou", {
        p_meeting_id: meetingId,
      })

      if (!result.error) {
        after(() =>
          sendTrackedMeetingActivityEmail({
            meetingId,
            actor: {
              type: userRole === "superadmin" ? "superadmin" : "admin",
              userId: identity.userId,
              name: identity.displayName,
            },
            trigger: "mou_activity",
            subject: "The meeting is complete and the MOU is ready",
            text: "The Plexus meeting was marked complete. Both matched Vendors can now review and sign the MOU from their workspace.",
            source: {
              table: "meetings",
              id: meetingId,
            },
            includeAdmins: true,
          })
        )
      }

      return result
    },
    { role: "admin" }
  )
}

const interpreterSchema = z.object({
  name: z.string().trim().min(2).max(120),
  languages: z.string().trim().min(2).max(120),
  email: z.email().or(z.literal("")).default(""),
  notes: z.string().trim().max(1000).default(""),
  available: z.boolean().default(true),
})

export async function createInterpreterAction(
  input: unknown
): Promise<ActionResult> {
  const parsed = interpreterSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Check the interpreter fields and try again." }
  }

  return runMutation(
    async ({ supabase }) =>
      await supabase.from("interpreters").insert({
        name: parsed.data.name,
        languages: parsed.data.languages,
        email: parsed.data.email,
        notes: parsed.data.notes,
        available: parsed.data.available,
      }),
    { role: "admin" }
  )
}

export async function updateInterpreterAction(
  interpreterId: string,
  input: unknown
): Promise<ActionResult> {
  const parsed = interpreterSchema.safeParse(input)

  if (!isUuid(interpreterId) || !parsed.success) {
    return { ok: false, error: "Check the interpreter fields and try again." }
  }

  return runMutation(
    async ({ supabase }) =>
      await supabase
        .from("interpreters")
        .update({
          name: parsed.data.name,
          languages: parsed.data.languages,
          email: parsed.data.email,
          notes: parsed.data.notes,
          available: parsed.data.available,
        })
        .eq("id", interpreterId),
    { role: "admin" }
  )
}

export async function deleteInterpreterAction(
  interpreterId: string
): Promise<ActionResult> {
  if (!isUuid(interpreterId)) {
    return { ok: false, error: "Invalid interpreter id." }
  }

  return runMutation(
    async ({ supabase }) =>
      await supabase.from("interpreters").delete().eq("id", interpreterId),
    { role: "admin" }
  )
}

export async function assignMeetingInterpreterAction(
  meetingId: string,
  interpreterId: string | null
): Promise<ActionResult> {
  const parsedInterpreter = z
    .union([uuidSchema, z.null()])
    .safeParse(interpreterId)

  if (!isUuid(meetingId) || !parsedInterpreter.success) {
    return { ok: false, error: "Invalid interpreter assignment." }
  }

  const assignedId = parsedInterpreter.data

  return runMutation(
    async ({ supabase }) => {
      let interpreterText = "To be confirmed"

      if (assignedId) {
        const interpreterResult = await supabase
          .from("interpreters")
          .select("name, languages")
          .eq("id", assignedId)
          .single()

        if (interpreterResult.error) {
          return {
            error: { message: "The selected interpreter no longer exists." },
          }
        }

        interpreterText = `${interpreterResult.data.name} · ${interpreterResult.data.languages}`
      }

      // Only update the confirmed interpreter (display text); the requester's
      // preference in requested_interpreter_id is preserved for the record.
      return supabase
        .from("meetings")
        .update({ interpreter: interpreterText })
        .eq("id", meetingId)
    },
    { role: "admin" }
  )
}

export async function updateDealAction(
  dealId: string,
  status: Deal["status"]
): Promise<ActionResult> {
  const parsed = dealStatusSchema.safeParse(status)

  if (!isUuid(dealId) || !parsed.success) {
    return { ok: false, error: "Invalid deal update." }
  }

  if (parsed.data === "Signed") {
    return {
      ok: false,
      error: "Both Vendors must sign the MOU before it can be marked Signed.",
    }
  }

  return runMutation(
    async ({ supabase }) =>
      await supabase
        .from("deals")
        .update({ status: parsed.data })
        .eq("id", dealId),
    { role: "admin" }
  )
}

export async function signVendorMouAction(
  dealId: string,
  agreed: boolean
): Promise<ActionResult> {
  const agreement = z.literal(true).safeParse(agreed)

  if (!isUuid(dealId) || !agreement.success) {
    return {
      ok: false,
      error: "Confirm that you agree to the MOU before signing.",
    }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      const result = await supabase.rpc("sign_vendor_mou", {
        p_deal_id: dealId,
        p_agreed: agreement.data,
      })

      if (!result.error) {
        after(() =>
          sendTrackedDealActivityEmail({
            dealId,
            actor: {
              type: "vendor",
              userId: identity.userId,
              name: identity.displayName,
            },
            subject: "A Vendor signed the Plexus MOU",
            text: `${identity.displayName} recorded its authorized MOU signature. Sign in to review the current two-party signing status.`,
          })
        )
      }

      return result
    },
    { role: "vendor" }
  )
}

export async function createDealAction(matchId: string): Promise<ActionResult> {
  if (!isUuid(matchId)) {
    return { ok: false, error: "Select a valid Vendor match." }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      if (identity.role !== "admin" || !identity.adminId) {
        return {
          error: {
            message: "Only an Admin tenant operator can create an MOU.",
          },
        }
      }

      const matchResult = await supabase
        .from("matches")
        .select("id")
        .eq("id", matchId)
        .eq("admin_id", identity.adminId)
        .maybeSingle()

      if (matchResult.error) {
        return { error: matchResult.error }
      }

      if (!matchResult.data) {
        return {
          error: { message: "The selected Vendor match was not found." },
        }
      }

      const existingResult = await supabase
        .from("deals")
        .select("id")
        .eq("match_id", matchId)
        .eq("admin_id", identity.adminId)
        .limit(1)

      if (existingResult.error) {
        return { error: existingResult.error }
      }

      if (existingResult.data.length) {
        return {
          error: {
            message: "This Vendor match already has an MOU record.",
          },
        }
      }

      const insertResult = await supabase
        .from("deals")
        .insert({
          match_id: matchId,
          admin_id: identity.adminId,
          status: "Under Discussion",
          document: "Pending upload",
          signatory_check: "Pending",
        })
        .select("id")
        .single()

      if (!insertResult.error) {
        after(() =>
          sendTrackedMatchActivityEmail({
            matchId,
            actor: {
              type: "admin",
              userId: identity.userId,
              name: identity.displayName,
            },
            trigger: "mou_activity",
            subject: "A Plexus MOU was opened",
            text: "The Admin opened an MOU record for this match. Sign in to follow its document and signing status.",
            source: {
              table: "deals",
              id: insertResult.data.id,
            },
            includeAdmins: true,
          })
        )
      }

      return insertResult
    },
    { role: "admin" }
  )
}

export async function confirmAttendanceAction(
  partnerId: string
): Promise<ActionResult> {
  if (!isUuid(partnerId)) {
    return { ok: false, error: "Invalid partner id." }
  }

  return runMutation(async ({ supabase, identity, userRole }) => {
    const result = await supabase
      .from("partner_companies")
      .update({ attendance: "Confirmed", status: "Confirmed" })
      .eq("id", partnerId)
      .select("id")
      .single()

    if (!result.error) {
      after(() =>
        sendTrackedVendorActivityEmail({
          vendorId: partnerId,
          actor: {
            type: userRole === "vendor" ? "vendor" : "admin",
            userId: identity.userId,
            name: identity.displayName,
          },
          subject: "Attendance confirmed in Plexus",
          text: "Your event attendance is confirmed. Sign in to review the latest itinerary and event resources.",
          source: {
            table: "partner_companies",
            id: partnerId,
          },
          includeAdmins: true,
        })
      )
    }

    return result
  })
}

export async function checkInPartnerAction(
  partnerId: string
): Promise<ActionResult> {
  if (!isUuid(partnerId)) {
    return { ok: false, error: "Invalid partner id." }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      const result = await supabase
        .from("partner_companies")
        .update({ attendance: "Arrived", arrived: true })
        .eq("id", partnerId)
        .select("id")
        .single()

      if (!result.error) {
        after(() =>
          sendTrackedVendorActivityEmail({
            vendorId: partnerId,
            actor: {
              type: "admin",
              userId: identity.userId,
              name: identity.displayName,
            },
            subject: "Event check-in recorded",
            text: "Your arrival was checked in by the Admin team. Sign in to review the latest on-site information.",
            source: {
              table: "partner_companies",
              id: partnerId,
            },
            includeAdmins: true,
          })
        )
      }

      return result
    },
    { role: "admin" }
  )
}

export async function publishItineraryAction(
  slotId: string
): Promise<ActionResult> {
  if (!isUuid(slotId)) {
    return { ok: false, error: "Invalid itinerary slot id." }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      const { data, error } = await supabase
        .from("itinerary_slots")
        .select("published, admin_id, activity")
        .eq("id", slotId)
        .single()

      if (error) {
        return { error }
      }

      const result = await supabase
        .from("itinerary_slots")
        .update({ published: !data.published })
        .eq("id", slotId)
        .select("id")
        .single()

      if (!result.error && !data.published) {
        after(async () => {
          const recipients = await getTenantEmailRecipients({
            adminId: data.admin_id,
            target: "all",
          })
          const subject = `Itinerary published: ${data.activity}`
          const text =
            "The Admin published an itinerary update. Sign in to Plexus to review the latest schedule."

          await sendTrackedEmails(
            recipients.map((recipient) => ({
              adminId: data.admin_id,
              actor: {
                type: "admin" as const,
                userId: identity.userId,
                name: identity.displayName,
              },
              recipient,
              trigger: "operations_activity" as const,
              subject,
              text,
              source: {
                table: "itinerary_slots",
                id: slotId,
              },
            }))
          )
        })
      }

      return result
    },
    { role: "admin" }
  )
}

export async function updateCompanyProfileAction(
  kind: "delegation" | "partner",
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = registrationProfileSchema.safeParse(values)

  if (!isUuid(id) || !parsed.success) {
    return { ok: false, error: "Check the company profile and try again." }
  }

  const profile = parsed.data
  const persistence = buildCompanyProfilePersistence(kind, profile)

  return runMutation(async ({ supabase, identity, userRole }) => {
    if (
      userRole === "vendor" &&
      (identity.vendorType !== kind || identity.vendorCompanyId !== id)
    ) {
      return {
        error: { message: "You can only update your own company profile." },
      }
    }

    if (persistence.kind === "delegation") {
      return await supabase
        .from("delegation_companies")
        .update(persistence.values)
        .eq("id", id)
    }

    return await supabase
      .from("partner_companies")
      .update(persistence.values)
      .eq("id", id)
  })
}

export async function sendAnnouncementAction(input: {
  title: string
  message: string
  target: AnnouncementTarget
  channel: AnnouncementChannel
  status?: Announcement["status"]
}): Promise<ActionResult> {
  const parsed = z
    .object({
      title: z.string().trim().min(3).max(120),
      message: z.string().trim().min(10).max(2000),
      target: announcementTargetSchema,
      channel: announcementChannelSchema,
      status: z.enum(["Draft", "Queued", "Sent"]).optional(),
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Check the announcement fields and try again." }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      if (!identity.adminId) {
        return {
          error: {
            message: "An Admin tenant is required to send announcements.",
          },
        }
      }

      const status = parsed.data.status ?? "Queued"
      const shouldDeliver = status !== "Draft"
      const announcementResult = await supabase
        .from("announcements")
        .insert({
          title: parsed.data.title,
          message: parsed.data.message,
          target: parsed.data.target,
          channel: parsed.data.channel,
          status:
            status === "Draft"
              ? "Draft"
              : parsed.data.channel === "notification"
                ? "Sent"
                : "Queued",
          sent_at:
            shouldDeliver && parsed.data.channel === "notification"
              ? new Date().toISOString()
              : null,
          created_by: identity.displayName,
          admin_id: identity.adminId,
        })
        .select("id")
        .single()

      if (announcementResult.error) {
        return announcementResult
      }

      if (!shouldDeliver) {
        return
      }

      let notificationError: {
        message: string
      } | null = null

      if (
        parsed.data.channel === "notification" ||
        parsed.data.channel === "both"
      ) {
        const notificationResult = await supabase.from("notifications").insert({
          message: `${parsed.data.title}: ${parsed.data.message}`,
          admin_id: identity.adminId,
        })
        notificationError = notificationResult.error
      }

      if (notificationError) {
        return { error: notificationError }
      }

      if (parsed.data.channel === "email" || parsed.data.channel === "both") {
        const recipients = await getTenantEmailRecipients({
          adminId: identity.adminId,
          target: parsed.data.target,
        })
        const deliveryResults = await sendTrackedEmails(
          recipients.map((recipient) => ({
            adminId: identity.adminId,
            actor: {
              type: "admin" as const,
              userId: identity.userId,
              name: identity.displayName,
            },
            recipient,
            trigger: "information_blast" as const,
            subject: parsed.data.title,
            text: parsed.data.message,
            html: renderPlexusEmail({
              title: parsed.data.title,
              message: parsed.data.message,
            }),
            source: {
              table: "announcements",
              id: announcementResult.data.id,
            },
          }))
        )
        const failedCount = deliveryResults.filter(
          (result) => !result.ok
        ).length

        if (failedCount === 0 && recipients.length > 0) {
          const sentAt = new Date().toISOString()
          await supabase
            .from("announcements")
            .update({
              status: "Sent",
              sent_at: sentAt,
            })
            .eq("id", announcementResult.data.id)
        } else {
          return {
            warning:
              recipients.length === 0
                ? "The announcement was saved, but the selected audience has no active email recipients."
                : `${failedCount} of ${recipients.length} email deliveries failed. Review Email sending in Superadmin.`,
          }
        }
      }
    },
    { role: "admin" }
  )
}

export async function createResourceAction(input: {
  title: string
  category: EventResource["category"]
  fileName: string
  fileUrl: string
  audience: EventResource["audience"]
  visibleToDelegation: boolean
  notes: string
}): Promise<ActionResult> {
  const parsed = z
    .object({
      title: z.string().trim().min(3).max(120),
      category: resourceCategorySchema,
      fileName: z.string().trim().min(3).max(160),
      fileUrl: z.string().trim().min(1).max(500),
      audience: resourceAudienceSchema,
      visibleToDelegation: z.boolean(),
      notes: z.string().trim().max(1000),
    })
    .safeParse(input)

  if (!parsed.success) {
    return { ok: false, error: "Check the resource fields and try again." }
  }

  return runMutation(
    async ({ supabase, identity }) => {
      if (!identity.adminId) {
        return {
          error: {
            message: "An Admin tenant is required to publish resources.",
          },
        }
      }

      const result = await supabase
        .from("event_resources")
        .insert({
          title: parsed.data.title,
          category: parsed.data.category,
          file_name: parsed.data.fileName,
          file_url: parsed.data.fileUrl,
          audience: parsed.data.audience,
          visible_to_delegation: parsed.data.visibleToDelegation,
          notes: parsed.data.notes,
          admin_id: identity.adminId,
        })
        .select("id")
        .single()

      if (!result.error) {
        after(() =>
          sendTrackedTenantActivityEmail({
            adminId: identity.adminId!,
            actor: {
              type: "admin",
              userId: identity.userId,
              name: identity.displayName,
            },
            target: parsed.data.audience,
            subject: `New Plexus resource: ${parsed.data.title}`,
            text: `The Admin published a new ${parsed.data.category.toLowerCase()} resource. Sign in to Plexus to review it.`,
            source: {
              table: "event_resources",
              id: result.data.id,
            },
          })
        )
      }

      return result
    },
    { role: "admin" }
  )
}

export async function toggleResourceVisibilityAction(
  resourceId: string,
  visibleToDelegation: boolean
): Promise<ActionResult> {
  if (!isUuid(resourceId)) {
    return { ok: false, error: "Invalid resource id." }
  }

  return runMutation(
    async ({ supabase }) =>
      await supabase
        .from("event_resources")
        .update({ visible_to_delegation: visibleToDelegation })
        .eq("id", resourceId),
    { role: "admin" }
  )
}

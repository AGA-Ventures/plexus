"use server"

import { z } from "zod"

import type { AppRole } from "@/lib/auth"
import { validateAuthenticatedUser } from "@/lib/authorization"
import {
  getCompanyProfileCompletion,
  registrationProfileSchema,
} from "@/lib/company-profile"
import {
  getSubmittedCompanyIndustrySector,
  isPlaceholderIndustrySector,
} from "@/lib/industry-sectors"
import { matchNoteFromScore, scoreMatch } from "@/lib/matching"
import { ensureAutomaticMeetingAfterAcceptance } from "@/lib/meeting-automation"
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
  Meeting,
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
const meetingSlotSchema = z
  .array(z.iso.datetime({ offset: true }))
  .min(3)
  .max(6)
  .optional()
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

        return supabase
          .from("meetings")
          .update({
            interpreter: interpreterLabel,
            requested_interpreter_id: interpreter?.id ?? null,
          })
          .eq("id", parsed.data.meetingId)
          .eq("admin_id", identity.adminId)
      }

      return supabase
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

    return supabase.from("matches").insert({
      delegation_company_id: delegationId,
      partner_company_id: partnerId,
      status: "Proposed",
      score: result.score,
      note: `Self-requested by ${identity.vendorType} Vendor. ${matchNoteFromScore(result)}`,
    })
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
      if (!["Accepted", "Rejected"].includes(parsed.data)) {
        return {
          error: {
            message: "Vendors can only accept or request a change.",
          },
        }
      }

      const acceptedAtField =
        identity.vendorType === "delegation"
          ? "delegation_accepted_at"
          : "partner_accepted_at"

      const decisionResult = await supabase
        .from("matches")
        .update({
          [acceptedAtField]:
            parsed.data === "Accepted" ? new Date().toISOString() : null,
          ...(parsed.data === "Rejected"
            ? { status: "Rejected" as const }
            : {}),
        })
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

      if (
        parsed.data === "Accepted" &&
        match.status === "Accepted" &&
        match.delegation_accepted_at &&
        match.partner_accepted_at
      ) {
        await ensureAutomaticMeetingAfterAcceptance({
          matchId: match.id,
          adminId: match.admin_id,
          actor: {
            userId: identity.userId,
            role: identity.role,
          },
        })
      }

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

    return await supabase
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
  })
}

export async function scheduleMeetingAction(
  matchId: string,
  requestedSlots?: string[],
  requestedInterpreterId?: string | null
): Promise<ActionResult> {
  const parsedSlots = meetingSlotSchema.safeParse(requestedSlots)
  const parsedInterpreter = z
    .union([uuidSchema, z.null()])
    .optional()
    .safeParse(requestedInterpreterId)

  if (!isUuid(matchId) || !parsedSlots.success || !parsedInterpreter.success) {
    return { ok: false, error: "Invalid match id." }
  }

  const interpreterId = parsedInterpreter.data ?? null
  const meetingSlots = parsedSlots.data ?? []

  if (meetingSlots.length > 0 && !meetingSlots.every(isValidMeetingSlot)) {
    return {
      ok: false,
      error: "Select at least 3 future one-hour working-day slots.",
    }
  }

  const meetingId = crypto.randomUUID()

  return runMutation(async ({ supabase, identity, userRole }) => {
    const matchResult = await supabase
      .from("matches")
      .select(
        "delegation_company_id, partner_company_id, status, delegation_accepted_at, partner_accepted_at"
      )
      .eq("id", matchId)
      .single()

    if (matchResult.error) {
      return matchResult
    }

    const match = matchResult.data
    const canSchedule =
      userRole === "superadmin" ||
      userRole === "admin" ||
      (userRole === "vendor" &&
        ((identity.vendorType === "delegation" &&
          identity.vendorCompanyId === match.delegation_company_id) ||
          (identity.vendorType === "partner" &&
            identity.vendorCompanyId === match.partner_company_id)))

    if (!canSchedule) {
      return {
        error: {
          message: "You can only request meetings for your own matches.",
        },
      }
    }

    if (
      !match.delegation_accepted_at ||
      !match.partner_accepted_at ||
      match.status !== "Accepted"
    ) {
      return {
        error: {
          message:
            match.status === "Session Scheduled"
              ? "The protected meeting has already been created."
              : "Both Vendors must accept before requesting a meeting.",
        },
      }
    }

    let requestedInterpreter: { name: string; languages: string } | null = null

    if (interpreterId) {
      const interpreterResult = await supabase
        .from("interpreters")
        .select("name, languages, available")
        .eq("id", interpreterId)
        .single()

      if (interpreterResult.error) {
        return {
          error: {
            message: "The selected interpreter is no longer available.",
          },
        }
      }

      if (!interpreterResult.data.available) {
        return {
          error: { message: "The selected interpreter is not available." },
        }
      }

      requestedInterpreter = {
        name: interpreterResult.data.name,
        languages: interpreterResult.data.languages,
      }
    }

    const existingMeeting = await supabase
      .from("meetings")
      .select("id")
      .eq("match_id", matchId)
      .limit(1)

    if (existingMeeting.error) {
      return existingMeeting
    }

    const startsAt = meetingSlots[0] ?? "2026-07-15T11:00:00+08:00"
    const interpreterNote = requestedInterpreter
      ? ` Preferred interpreter: ${requestedInterpreter.name} (${requestedInterpreter.languages}) — admin to confirm.`
      : ""
    const summary =
      (meetingSlots.length > 0
        ? `Participant selected preferred 1-hour working-day slots: ${meetingSlots.join(", ")}. Admin should confirm one slot and replace the placeholder with the final Zoom/Lark session.`
        : userRole === "admin" || userRole === "superadmin"
          ? "Admin recorded a meeting request. Create the protected Zoom/Lark session after both Vendors accept."
          : "Participant requested a meeting after both Vendors accepted. Admin must create the protected Zoom/Lark session.") +
      interpreterNote

    if ((existingMeeting.data ?? []).length > 0) {
      return supabase
        .from("meetings")
        .update({
          starts_at: startsAt,
          duration_minutes: 60,
          platform: "Pending",
          link: "",
          requested_interpreter_id: interpreterId,
          summary,
          status: "Scheduled",
        })
        .eq("id", existingMeeting.data?.[0]?.id)
    }

    return supabase.from("meetings").insert({
      id: meetingId,
      match_id: matchId,
      starts_at: startsAt,
      duration_minutes: 60,
      platform: "Pending",
      link: "",
      interpreter: "To be confirmed",
      requested_interpreter_id: interpreterId,
      host: "Sarah Lim",
      status: "Scheduled",
      summary,
    })
  })
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

function isValidMeetingSlot(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T(09|10|11|14|15|16):00:00\+08:00$/.test(value)) {
    return false
  }

  const date = new Date(value)
  const day = date.getUTCDay()

  return date.getTime() > Date.now() && day >= 1 && day <= 5
}

export async function completeMeetingAction(
  meetingId: string
): Promise<ActionResult> {
  if (!isUuid(meetingId)) {
    return { ok: false, error: "Invalid meeting id." }
  }

  return runMutation(
    async ({ supabase }) =>
      await supabase
        .from("meetings")
        .update({
          status: "Completed" satisfies Meeting["status"],
          summary:
            "Admin summary saved: both parties requested September follow-up.",
        })
        .eq("id", meetingId),
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

  return runMutation(
    async ({ supabase }) =>
      await supabase
        .from("deals")
        .update({ status: parsed.data })
        .eq("id", dealId),
    { role: "admin" }
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

      return supabase.from("deals").insert({
        match_id: matchId,
        admin_id: identity.adminId,
        status: "Under Discussion",
        document: "Pending upload",
        signatory_check: "Pending",
      })
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

  return runMutation(
    async ({ supabase }) =>
      await supabase
        .from("partner_companies")
        .update({ attendance: "Confirmed", status: "Confirmed" })
        .eq("id", partnerId)
  )
}

export async function checkInPartnerAction(
  partnerId: string
): Promise<ActionResult> {
  if (!isUuid(partnerId)) {
    return { ok: false, error: "Invalid partner id." }
  }

  return runMutation(
    async ({ supabase }) =>
      await supabase
        .from("partner_companies")
        .update({ attendance: "Arrived", arrived: true })
        .eq("id", partnerId),
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
    async ({ supabase }) => {
      const { data, error } = await supabase
        .from("itinerary_slots")
        .select("published")
        .eq("id", slotId)
        .single()

      if (error) {
        return { error }
      }

      return supabase
        .from("itinerary_slots")
        .update({ published: !data.published })
        .eq("id", slotId)
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
  const profileComplete = getCompanyProfileCompletion(profile).percentage
  const submittedSector = getSubmittedCompanyIndustrySector(profile)

  return runMutation(async ({ supabase, identity, userRole }) => {
    if (
      userRole === "vendor" &&
      (identity.vendorType !== kind || identity.vendorCompanyId !== id)
    ) {
      return {
        error: { message: "You can only update your own company profile." },
      }
    }

    if (kind === "delegation") {
      return await supabase
        .from("delegation_companies")
        .update({
          ...(submittedSector ? { sector: submittedSector } : {}),
          name_en: profile.companyNameEn,
          name_cn: profile.companyNameCn || profile.companyNameEn,
          origin: profile.countryOther || profile.countryRegion || "Pending",
          company_size: profile.employeeRange || "Pending",
          needs:
            profile.opportunity || profile.idealPartner || "Pending profile",
          contact: profile.contactName || "Pending contact",
          contact_meta: [
            profile.contactPosition,
            profile.contactEmail,
            profile.mobileNumber,
            profile.chatId,
          ]
            .filter(Boolean)
            .join(" · "),
          profile_complete: profileComplete,
          status: profileComplete >= 90 ? "Locked" : "Incomplete",
          urgent: !profile.consent,
          profile_data: profile,
        })
        .eq("id", id)
    }

    return await supabase
      .from("partner_companies")
      .update({
        ...(submittedSector ? { sector: submittedSector } : {}),
        name_en: profile.companyNameEn,
        name_cn: profile.companyNameCn || profile.companyNameEn,
        company_size: profile.employeeRange || "Pending",
        offerings:
          profile.productsServices ||
          profile.offers.join(", ") ||
          "Pending profile",
        contact: profile.contactName || "Pending contact",
        contact_meta: [
          profile.contactPosition,
          profile.contactEmail,
          profile.mobileNumber,
          profile.chatId,
        ]
          .filter(Boolean)
          .join(" · "),
        profile_complete: profileComplete,
        verified:
          profileComplete >= 90 && profile.consent ? "Verified" : "Pending",
        profile_data: profile,
      })
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
    async ({ supabase }) => {
      const status = parsed.data.status ?? "Queued"
      const announcementResult = await supabase.from("announcements").insert({
        title: parsed.data.title,
        message: parsed.data.message,
        target: parsed.data.target,
        channel: parsed.data.channel,
        status,
        sent_at: status === "Sent" ? new Date().toISOString() : null,
        created_by: "Admin team",
      })

      if (announcementResult.error) {
        return announcementResult
      }

      if (
        parsed.data.channel === "notification" ||
        parsed.data.channel === "both"
      ) {
        return supabase.from("notifications").insert({
          message: `${parsed.data.title}: ${parsed.data.message}`,
        })
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
    async ({ supabase }) =>
      await supabase.from("event_resources").insert({
        title: parsed.data.title,
        category: parsed.data.category,
        file_name: parsed.data.fileName,
        file_url: parsed.data.fileUrl,
        audience: parsed.data.audience,
        visible_to_delegation: parsed.data.visibleToDelegation,
        notes: parsed.data.notes,
      }),
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

import "server-only"

import type { AppRole } from "@/lib/auth"
import { createMeeting, type MeetingProvider } from "@/lib/meetings"
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin"

export const meetingCreationFailureCodes = [
  "configuration",
  "authorization",
  "rate_limited",
  "timeout",
  "provider_error",
  "storage_error",
  "agreement_changed",
  "incident_store_error",
] as const

export type MeetingCreationFailureCode =
  (typeof meetingCreationFailureCodes)[number]

export type AutomaticMeetingCreationState =
  | "created"
  | "already_created"
  | "processing"
  | "failed"

type ActorContext = {
  userId: string | null
  role: AppRole | null
}

type MeetingCreationJob = {
  id: string
  match_id: string
  admin_id: string
  provider: MeetingProvider
  status: "processing" | "succeeded" | "failed"
  attempt_count: number
}

const failureSummaries: Record<MeetingCreationFailureCode, string> = {
  configuration: "Meeting provider configuration is incomplete.",
  authorization: "Meeting provider authorization is unavailable or expired.",
  rate_limited: "The meeting provider rate limit blocked creation.",
  timeout: "The meeting provider request timed out.",
  provider_error:
    "The meeting provider rejected or returned an invalid meeting.",
  storage_error: "Plexus could not persist the protected meeting.",
  agreement_changed: "The Vendors' mutual agreement is no longer active.",
  incident_store_error:
    "Plexus could not initialize automatic meeting creation.",
}

export function getAutomaticMeetingProvider(
  configuredProvider = process.env.PLEXUS_DEFAULT_MEETING_PROVIDER
): MeetingProvider {
  return configuredProvider?.toLowerCase() === "lark" ? "lark" : "zoom"
}

export function classifyMeetingCreationFailure(
  error: unknown
): MeetingCreationFailureCode {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`.toLowerCase()
      : String(error).toLowerCase()

  if (message.includes("both vendors") || message.includes("agreement")) {
    return "agreement_changed"
  }
  if (message.includes("missing required")) {
    return "configuration"
  }
  if (
    message.includes("not authorized") ||
    message.includes("authorization") ||
    message.includes("authentication")
  ) {
    return "authorization"
  }
  if (message.includes("429") || message.includes("rate limit")) {
    return "rate_limited"
  }
  if (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("aborterror")
  ) {
    return "timeout"
  }
  if (
    message.includes("store") ||
    message.includes("persist") ||
    message.includes("read") ||
    message.includes("verify")
  ) {
    return "storage_error"
  }
  return "provider_error"
}

export function meetingCreationFailureSummary(
  code: MeetingCreationFailureCode
) {
  return failureSummaries[code]
}

async function writeAuditEvent(input: {
  actor: ActorContext
  action:
    | "automatic_meeting_creation_failed"
    | "automatic_meeting_creation_succeeded"
  jobId: string | null
  matchId: string
  adminId: string
  provider: MeetingProvider
  attemptCount: number
  failureCode?: MeetingCreationFailureCode
}) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("audit_events").insert({
    actor_user_id: input.actor.userId,
    actor_role: input.actor.role,
    action: input.action,
    target_table: "meeting_creation_jobs",
    target_id: input.jobId,
    admin_id: input.adminId,
    after_values: {
      match_id: input.matchId,
      provider: input.provider,
      attempt_count: input.attemptCount,
      ...(input.failureCode
        ? {
            status: "failed",
            failure_code: input.failureCode,
          }
        : { status: "succeeded" }),
    },
  })

  if (error) {
    console.error("Automatic meeting audit write failed.", {
      action: input.action,
      jobId: input.jobId,
    })
  }
}

async function markJobFailed(
  job: MeetingCreationJob,
  code: MeetingCreationFailureCode,
  actor: ActorContext
) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("meeting_creation_jobs")
    .update({
      status: "failed",
      failure_code: code,
      failure_summary: meetingCreationFailureSummary(code),
      resolved_at: null,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("status", "processing")

  if (error) {
    console.error("Critical meeting incident could not be persisted.", {
      jobId: job.id,
      failureCode: code,
    })
  }

  await writeAuditEvent({
    actor,
    action: "automatic_meeting_creation_failed",
    jobId: job.id,
    matchId: job.match_id,
    adminId: job.admin_id,
    provider: job.provider,
    attemptCount: job.attempt_count,
    failureCode: code,
  })
}

async function executeMeetingCreationJob(
  job: MeetingCreationJob,
  actor: ActorContext
): Promise<AutomaticMeetingCreationState> {
  const supabase = createSupabaseAdminClient()
  const [matchResult, preferenceResult] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, admin_id, status, delegation_accepted_at, partner_accepted_at"
      )
      .eq("id", job.match_id)
      .eq("admin_id", job.admin_id)
      .maybeSingle(),
    supabase
      .from("meetings")
      .select("starts_at, duration_minutes")
      .eq("match_id", job.match_id)
      .eq("admin_id", job.admin_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const match = matchResult.data

  if (
    matchResult.error ||
    !match?.delegation_accepted_at ||
    !match.partner_accepted_at ||
    !["Accepted", "Session Scheduled"].includes(match.status)
  ) {
    await markJobFailed(job, "agreement_changed", actor)
    return "failed"
  }

  if (preferenceResult.error) {
    await markJobFailed(job, "storage_error", actor)
    return "failed"
  }

  try {
    await createMeeting({
      matchId: job.match_id,
      adminId: job.admin_id,
      provider: job.provider,
      topic: "Plexus business matching meeting",
      durationMinutes: preferenceResult.data?.duration_minutes ?? 60,
      startsAt: preferenceResult.data?.starts_at
        ? new Date(preferenceResult.data.starts_at)
        : undefined,
    })

    const resolvedAt = new Date().toISOString()
    const updateResult = await supabase
      .from("meeting_creation_jobs")
      .update({
        status: "succeeded",
        failure_code: null,
        failure_summary: null,
        resolved_at: resolvedAt,
        last_attempt_at: resolvedAt,
      })
      .eq("id", job.id)
      .eq("status", "processing")

    if (updateResult.error) {
      await markJobFailed(job, "storage_error", actor)
      return "failed"
    }

    await writeAuditEvent({
      actor,
      action: "automatic_meeting_creation_succeeded",
      jobId: job.id,
      matchId: job.match_id,
      adminId: job.admin_id,
      provider: job.provider,
      attemptCount: job.attempt_count,
    })

    return "created"
  } catch (error) {
    await markJobFailed(job, classifyMeetingCreationFailure(error), actor)
    return "failed"
  }
}

export async function ensureAutomaticMeetingAfterAcceptance(input: {
  matchId: string
  adminId: string
  actor: ActorContext
  provider?: MeetingProvider
}): Promise<AutomaticMeetingCreationState> {
  const supabase = createSupabaseAdminClient()
  const provider = input.provider ?? getAutomaticMeetingProvider()
  const now = new Date().toISOString()
  const claimResult = await supabase
    .from("meeting_creation_jobs")
    .insert({
      match_id: input.matchId,
      admin_id: input.adminId,
      provider,
      status: "processing",
      attempt_count: 1,
      last_attempt_at: now,
    })
    .select("id, match_id, admin_id, provider, status, attempt_count")
    .maybeSingle()

  if (claimResult.error) {
    if (claimResult.error.code === "23505") {
      const existingResult = await supabase
        .from("meeting_creation_jobs")
        .select("id, match_id, admin_id, provider, status, attempt_count")
        .eq("match_id", input.matchId)
        .maybeSingle()

      if (existingResult.data?.status === "succeeded") {
        return "already_created"
      }
      if (existingResult.data?.status === "processing") {
        return "processing"
      }
      return "failed"
    }

    await writeAuditEvent({
      actor: input.actor,
      action: "automatic_meeting_creation_failed",
      jobId: null,
      matchId: input.matchId,
      adminId: input.adminId,
      provider,
      attemptCount: 1,
      failureCode: "incident_store_error",
    })
    return "failed"
  }

  if (!claimResult.data) {
    return "processing"
  }

  return executeMeetingCreationJob(
    claimResult.data as MeetingCreationJob,
    input.actor
  )
}

export async function retryAutomaticMeetingCreation(input: {
  jobId: string
  actor: ActorContext
}): Promise<AutomaticMeetingCreationState> {
  const supabase = createSupabaseAdminClient()
  const existingResult = await supabase
    .from("meeting_creation_jobs")
    .select("id, match_id, admin_id, provider, status, attempt_count")
    .eq("id", input.jobId)
    .maybeSingle()

  const existing = existingResult.data as MeetingCreationJob | null

  if (existingResult.error || !existing) {
    throw new Error("The meeting creation incident is no longer available.")
  }
  if (existing.status === "succeeded") {
    return "already_created"
  }
  if (existing.status === "processing") {
    return "processing"
  }
  if (existing.attempt_count >= 20) {
    throw new Error("The critical incident reached its retry limit.")
  }

  const nextAttemptCount = existing.attempt_count + 1
  const claimResult = await supabase
    .from("meeting_creation_jobs")
    .update({
      status: "processing",
      attempt_count: nextAttemptCount,
      failure_code: null,
      failure_summary: null,
      resolved_at: null,
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("status", "failed")
    .eq("attempt_count", existing.attempt_count)
    .select("id, match_id, admin_id, provider, status, attempt_count")
    .maybeSingle()

  if (claimResult.error) {
    throw new Error("The critical meeting incident could not be claimed.")
  }
  if (!claimResult.data) {
    return "processing"
  }

  return executeMeetingCreationJob(
    claimResult.data as MeetingCreationJob,
    input.actor
  )
}

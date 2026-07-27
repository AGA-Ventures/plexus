import "server-only"

import { randomBytes } from "node:crypto"

import { createLarkMeeting } from "@/lib/lark"
import {
  classifyMeetingProviderReadiness,
  type MeetingProviderReadiness,
} from "@/lib/meeting-provider-readiness"
import {
  createSupabaseAdminClient,
  hasSupabaseAdminSecret,
} from "@/lib/supabaseAdmin"
import { createZoomMeeting } from "@/lib/zoom"

export const meetingProviders = ["zoom", "lark"] as const
export type MeetingProvider = (typeof meetingProviders)[number]

const MIN_DURATION_MINUTES = 30
const MAX_DURATION_MINUTES = 480

function hasCompleteConfiguration(names: string[]) {
  return names.every((name) => Boolean(process.env[name]))
}

export async function getMeetingProviderReadiness(): Promise<MeetingProviderReadiness> {
  const zoomEnvironmentConfigured = hasCompleteConfiguration([
    "ZOOM_ACCOUNT_ID",
    "ZOOM_CLIENT_ID",
    "ZOOM_CLIENT_SECRET",
  ])
  const larkEnvironmentConfigured = hasCompleteConfiguration([
    "LARK_APP_ID",
    "LARK_APP_SECRET",
    "LARK_REDIRECT_URI",
  ])
  const protectedLinkOriginConfigured = Boolean(process.env.NEXT_PUBLIC_APP_URL)
  let protectedLinkStoreConfigured = false
  let larkTokenStoreConfigured = false
  let larkAuthorized = false

  if (hasSupabaseAdminSecret()) {
    try {
      const supabase = createSupabaseAdminClient()
      const [linkStoreResult, tokenResult] = await Promise.all([
        supabase.from("meeting_provider_links").select("id").limit(1),
        supabase
          .from("oauth_tokens")
          .select("refresh_token_expires_at")
          .eq("id", "lark")
          .maybeSingle(),
      ])

      const refreshTokenExpiresAt = tokenResult.data?.refresh_token_expires_at
      protectedLinkStoreConfigured = !linkStoreResult.error
      larkTokenStoreConfigured = !tokenResult.error
      larkAuthorized =
        !tokenResult.error &&
        Boolean(tokenResult.data) &&
        (!refreshTokenExpiresAt ||
          new Date(refreshTokenExpiresAt).getTime() > Date.now())
    } catch {
      larkAuthorized = false
    }
  }

  return classifyMeetingProviderReadiness({
    zoomConfigured: zoomEnvironmentConfigured,
    larkConfigured: larkEnvironmentConfigured && larkTokenStoreConfigured,
    larkAuthorized,
    protectedLinksConfigured:
      protectedLinkOriginConfigured && protectedLinkStoreConfigured,
  })
}

export function normalizeMeetingDuration(durationMinutes = 60) {
  const normalizedDuration = Number.isFinite(durationMinutes)
    ? Math.round(durationMinutes)
    : 60

  return Math.max(
    MIN_DURATION_MINUTES,
    Math.min(MAX_DURATION_MINUTES, normalizedDuration)
  )
}

export function normalizeMeetingStart(
  startsAt: Date | undefined,
  now = new Date()
) {
  return startsAt &&
    Number.isFinite(startsAt.getTime()) &&
    startsAt.getTime() > now.getTime()
    ? startsAt
    : now
}

export function buildMeetingShareUrl(slug: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    throw new Error(
      "Missing required meeting configuration: NEXT_PUBLIC_APP_URL."
    )
  }

  return new URL(`/m/${slug}`, appUrl).toString()
}

export function getMeetingWindowStatus(input: {
  now: number
  availableAt: number
  expiresAt: number
  openCount: number
  maxOpens: number
}) {
  if (input.now < input.availableAt) {
    return "not_started" as const
  }
  if (input.now > input.expiresAt) {
    return "expired" as const
  }
  if (input.openCount >= input.maxOpens) {
    return "access_limit" as const
  }
  return "active" as const
}

export async function createMeeting(input: {
  matchId: string
  adminId: string
  provider: MeetingProvider
  topic: string
  durationMinutes?: number
  startsAt?: Date
}) {
  const durationMinutes = normalizeMeetingDuration(input.durationMinutes)
  const startsAt = normalizeMeetingStart(input.startsAt)
  const expiresAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000)
  const supabase = createSupabaseAdminClient()

  const matchResult = await supabase
    .from("matches")
    .select("id, status, delegation_accepted_at, partner_accepted_at")
    .eq("id", input.matchId)
    .eq("admin_id", input.adminId)
    .maybeSingle()

  if (matchResult.error) {
    throw new Error("Unable to verify the accepted match.")
  }

  if (
    !matchResult.data?.delegation_accepted_at ||
    !matchResult.data.partner_accepted_at ||
    !["Accepted", "Session Scheduled"].includes(matchResult.data.status)
  ) {
    throw new Error("Both Vendors must accept before creating a meeting.")
  }

  const existingMeetingResult = await supabase
    .from("meetings")
    .select("id")
    .eq("match_id", input.matchId)
    .eq("admin_id", input.adminId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingMeetingResult.error) {
    throw new Error("Unable to check the existing meeting.")
  }

  if (existingMeetingResult.data?.id) {
    const existingLinkResult = await supabase
      .from("meeting_provider_links")
      .select("slug, expires_at, open_count, max_opens")
      .eq("meeting_id", existingMeetingResult.data.id)
      .maybeSingle()

    if (existingLinkResult.error) {
      throw new Error("Unable to check the existing meeting link.")
    }

    if (
      existingLinkResult.data &&
      new Date(existingLinkResult.data.expires_at).getTime() > Date.now() &&
      existingLinkResult.data.open_count < existingLinkResult.data.max_opens
    ) {
      return {
        shareUrl: buildMeetingShareUrl(existingLinkResult.data.slug),
        slug: existingLinkResult.data.slug,
        expiresAt: existingLinkResult.data.expires_at,
      }
    }
  }

  const providerMeeting =
    input.provider === "zoom"
      ? await createZoomMeeting({
          topic: input.topic,
          durationMinutes,
          startsAt,
        })
      : await createLarkMeeting({
          topic: input.topic,
          expiresAt,
        })

  const slug = randomBytes(24).toString("base64url")
  const shareUrl = buildMeetingShareUrl(slug)
  const platform = input.provider === "zoom" ? "Zoom" : "Lark"
  const existingMeetingId = existingMeetingResult.data?.id

  const meetingResult = existingMeetingId
    ? await supabase
        .from("meetings")
        .update({
          starts_at: startsAt.toISOString(),
          duration_minutes: durationMinutes,
          platform,
          link: shareUrl,
          status: "Scheduled",
          summary:
            "Secure provider meeting created after both Vendors accepted the match.",
        })
        .eq("id", existingMeetingId)
        .eq("admin_id", input.adminId)
        .select("id")
        .single()
    : await supabase
        .from("meetings")
        .insert({
          match_id: input.matchId,
          admin_id: input.adminId,
          starts_at: startsAt.toISOString(),
          duration_minutes: durationMinutes,
          platform,
          link: shareUrl,
          interpreter: "To be confirmed",
          host: "Plexus meeting host",
          status: "Scheduled",
          summary:
            "Secure provider meeting created after both Vendors accepted the match.",
        })
        .select("id")
        .single()

  if (meetingResult.error || !meetingResult.data) {
    throw new Error("Unable to store the provider meeting.")
  }

  const linkResult = await supabase.from("meeting_provider_links").upsert(
    {
      meeting_id: meetingResult.data.id,
      slug,
      provider: input.provider,
      topic: input.topic,
      join_url: providerMeeting.joinUrl,
      provider_meeting_id: providerMeeting.providerMeetingId,
      available_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      open_count: 0,
    },
    { onConflict: "meeting_id" }
  )

  if (linkResult.error) {
    throw new Error("Unable to store the protected meeting link.")
  }

  const matchUpdateResult = await supabase
    .from("matches")
    .update({ status: "Session Scheduled" })
    .eq("id", input.matchId)
    .eq("admin_id", input.adminId)

  if (matchUpdateResult.error) {
    throw new Error("Unable to advance the accepted match.")
  }

  return {
    shareUrl,
    slug,
    expiresAt: expiresAt.toISOString(),
  }
}

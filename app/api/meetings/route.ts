import { z } from "zod"

import { canOperateTenant, getAuthenticatedIdentity } from "@/lib/authorization"
import { createMeeting, meetingProviders } from "@/lib/meetings"

const requestSchema = z.object({
  matchId: z.uuid(),
  provider: z.enum(meetingProviders),
  topic: z.string().trim().min(1).max(200).default("Plexus meeting"),
  durationMinutes: z.number().int().min(30).max(480).optional(),
  startsAt: z.iso.datetime({ offset: true }).optional(),
})

export async function POST(request: Request) {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return Response.json({ error: authorization.error }, { status: 401 })
  }

  if (!["superadmin", "admin"].includes(authorization.identity.role)) {
    return Response.json(
      { error: "Superadmin or Admin access required." },
      { status: 403 }
    )
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return Response.json(
      { error: "Check the meeting request and try again." },
      { status: 400 }
    )
  }

  const matchResult = await authorization.supabase
    .from("matches")
    .select("id, admin_id, status, delegation_accepted_at, partner_accepted_at")
    .eq("id", parsed.data.matchId)
    .maybeSingle()

  if (matchResult.error) {
    return Response.json(
      { error: "Unable to verify the match." },
      { status: 502 }
    )
  }

  const match = matchResult.data

  if (!match) {
    return Response.json({ error: "Match not found." }, { status: 404 })
  }

  if (!canOperateTenant(authorization.identity, match.admin_id)) {
    return Response.json(
      { error: "You cannot create meetings for this tenant." },
      { status: 403 }
    )
  }

  if (
    !match.delegation_accepted_at ||
    !match.partner_accepted_at ||
    !["Accepted", "Session Scheduled"].includes(match.status)
  ) {
    return Response.json(
      { error: "Both Vendors must accept before a meeting can be created." },
      { status: 409 }
    )
  }

  try {
    const meeting = await createMeeting({
      matchId: match.id,
      adminId: match.admin_id,
      provider: parsed.data.provider,
      topic: parsed.data.topic,
      durationMinutes: parsed.data.durationMinutes,
      startsAt: parsed.data.startsAt
        ? new Date(parsed.data.startsAt)
        : undefined,
    })

    return Response.json(
      {
        shareUrl: meeting.shareUrl,
        expiresAt: meeting.expiresAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Meeting creation failed.", {
      error:
        error instanceof Error
          ? error.message
          : "Unexpected meeting provider error.",
    })
    return Response.json(
      { error: "The meeting provider could not create the meeting." },
      { status: 502 }
    )
  }
}

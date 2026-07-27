import { NextResponse } from "next/server"

import { getMeetingWindowStatus } from "@/lib/meetings"
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin"

const MAX_CONSUME_ATTEMPTS = 3

function plainResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!/^[A-Za-z0-9_-]{32,}$/.test(slug)) {
    return plainResponse("Meeting not found", 404)
  }

  const supabase = createSupabaseAdminClient()

  for (let attempt = 0; attempt < MAX_CONSUME_ATTEMPTS; attempt += 1) {
    const meetingResult = await supabase
      .from("meeting_provider_links")
      .select("id, join_url, available_at, expires_at, open_count, max_opens")
      .eq("slug", slug)
      .maybeSingle()

    if (meetingResult.error) {
      return plainResponse("Meeting link unavailable", 502)
    }

    const meeting = meetingResult.data

    if (!meeting) {
      return plainResponse("Meeting not found", 404)
    }

    const windowStatus = getMeetingWindowStatus({
      now: Date.now(),
      availableAt: new Date(meeting.available_at).getTime(),
      expiresAt: new Date(meeting.expires_at).getTime(),
      openCount: meeting.open_count,
      maxOpens: meeting.max_opens,
    })

    if (windowStatus === "not_started") {
      return plainResponse("This meeting link is not active yet", 425)
    }
    if (windowStatus === "expired") {
      return plainResponse("This meeting link has expired", 410)
    }
    if (windowStatus === "access_limit") {
      return plainResponse("This link has reached its access limit", 403)
    }

    let redirectUrl: URL
    try {
      redirectUrl = new URL(meeting.join_url)
    } catch {
      return plainResponse("Meeting link unavailable", 502)
    }

    if (redirectUrl.protocol !== "https:") {
      return plainResponse("Meeting link unavailable", 502)
    }

    const updateResult = await supabase
      .from("meeting_provider_links")
      .update({ open_count: meeting.open_count + 1 })
      .eq("id", meeting.id)
      .eq("open_count", meeting.open_count)
      .select("id")
      .maybeSingle()

    if (updateResult.error) {
      return plainResponse("Meeting link unavailable", 502)
    }

    if (!updateResult.data) {
      continue
    }

    const response = NextResponse.redirect(redirectUrl, 302)
    response.headers.set("Cache-Control", "no-store")
    response.headers.set("Referrer-Policy", "no-referrer")
    return response
  }

  return plainResponse("Meeting link is busy; try again", 503)
}

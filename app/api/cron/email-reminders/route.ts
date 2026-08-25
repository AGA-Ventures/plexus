import {
  sendTrackedDealActivityEmail,
  sendTrackedMeetingActivityEmail,
  sendTrackedTenantActivityEmail,
} from "@/lib/email-delivery-service"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()

  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`
  )
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return Response.json(
      { error: "Reminder scheduler is not configured." },
      { status: 503 }
    )
  }

  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const applicationCutoff = new Date(
    now.getTime() - 24 * 60 * 60 * 1000
  ).toISOString()
  const meetingWindowStart = new Date(
    now.getTime() + 23 * 60 * 60 * 1000
  ).toISOString()
  const meetingWindowEnd = new Date(
    now.getTime() + 25 * 60 * 60 * 1000
  ).toISOString()
  const mouCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const dayStart = new Date(now)
  dayStart.setUTCHours(0, 0, 0, 0)

  const adminClient = createSupabaseAdminClient()
  const [applicationsResult, meetingsResult, dealsResult, sentResult] =
    await Promise.all([
      adminClient
        .from("vendor_applications")
        .select("id, admin_id, company_name, created_at")
        .eq("status", "pending")
        .lte("created_at", applicationCutoff)
        .order("created_at", { ascending: true })
        .limit(100),
      adminClient
        .from("meetings")
        .select("id, starts_at")
        .eq("status", "Scheduled")
        .gte("starts_at", meetingWindowStart)
        .lte("starts_at", meetingWindowEnd)
        .order("starts_at", { ascending: true })
        .limit(100),
      adminClient
        .from("deals")
        .select("id, status, updated_at")
        .in("status", ["Under Discussion", "Agreement Reached"])
        .lte("updated_at", mouCutoff)
        .order("updated_at", { ascending: true })
        .limit(100),
      adminClient
        .from("email_deliveries")
        .select("source_table, source_id")
        .eq("trigger_key", "scheduled_reminder")
        .gte("requested_at", dayStart.toISOString()),
    ])

  if (
    applicationsResult.error ||
    meetingsResult.error ||
    dealsResult.error ||
    sentResult.error
  ) {
    return Response.json(
      { error: "Reminder candidates could not be loaded." },
      { status: 500 }
    )
  }

  const alreadySent = new Set(
    (sentResult.data ?? []).map(
      (delivery) => `${delivery.source_table}:${delivery.source_id}`
    )
  )
  let applications = 0
  let meetings = 0
  let mous = 0

  for (const application of applicationsResult.data ?? []) {
    const key = `vendor_applications:${application.id}`
    if (alreadySent.has(key)) continue

    const results = await sendTrackedTenantActivityEmail({
      adminId: application.admin_id,
      actor: {
        type: "plexus_system",
        name: "Plexus reminders",
      },
      target: "admin",
      trigger: "scheduled_reminder",
      subject: `Vendor application awaiting review: ${application.company_name}`,
      text: "This Vendor application has been pending for more than 24 hours. Sign in to review and record a decision.",
      source: {
        table: "vendor_applications",
        id: application.id,
      },
    })

    if (results.some((result) => result.ok)) applications += 1
  }

  for (const meeting of meetingsResult.data ?? []) {
    const key = `meetings:${meeting.id}`
    if (alreadySent.has(key)) continue

    const startsAt = new Intl.DateTimeFormat("en-MY", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(new Date(meeting.starts_at))
    const results = await sendTrackedMeetingActivityEmail({
      meetingId: meeting.id,
      actor: {
        type: "plexus_system",
        name: "Plexus reminders",
      },
      trigger: "scheduled_reminder",
      subject: "Your Plexus meeting starts in about 24 hours",
      text: `Your meeting is scheduled for ${startsAt}. Sign in to review the participants, interpreter, and protected meeting link.`,
      source: {
        table: "meetings",
        id: meeting.id,
      },
      includeAdmins: true,
    })

    if (results.some((result) => result.ok)) meetings += 1
  }

  for (const deal of dealsResult.data ?? []) {
    const key = `deals:${deal.id}`
    if (alreadySent.has(key)) continue

    const results = await sendTrackedDealActivityEmail({
      dealId: deal.id,
      actor: {
        type: "plexus_system",
        name: "Plexus reminders",
      },
      trigger: "scheduled_reminder",
      subject: "Your Plexus MOU is still awaiting completion",
      text: `The MOU remains ${deal.status.toLowerCase()}. Sign in to review the document and current two-party signing status.`,
      includeAdmins: true,
    })

    if (results.some((result) => result.ok)) mous += 1
  }

  return Response.json({
    ok: true,
    reminders: {
      applications,
      meetings,
      mous,
    },
  })
}

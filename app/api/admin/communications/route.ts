import { NextResponse } from "next/server"
import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import {
  getTenantEmailRecipients,
  renderPlexusEmail,
  sendTrackedEmails,
} from "@/lib/email-delivery-service"

const communicationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
  target: z.enum(["all", "delegation", "partner", "admin"]),
  channel: z.enum(["email", "notification", "both"]),
  status: z.enum(["Draft", "Queued", "Sent"]).optional(),
})

async function getAdminClient() {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return {
      error: NextResponse.json({ error: authorization.error }, { status: 401 }),
    }
  }

  if (
    authorization.identity.role !== "admin" ||
    !authorization.identity.adminId
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return {
    supabase: authorization.supabase,
    identity: authorization.identity,
  }
}

export async function POST(request: Request) {
  const auth = await getAdminClient()

  if ("error" in auth) {
    return auth.error
  }

  const adminId = auth.identity.adminId

  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = communicationSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid communication payload." },
      { status: 400 }
    )
  }

  const status = parsed.data.status ?? "Queued"
  const shouldDeliver = status !== "Draft"
  const result = await auth.supabase
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
      created_by: auth.identity.displayName,
      admin_id: adminId,
    })
    .select("*")
    .single()

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  if (!shouldDeliver) {
    return NextResponse.json({ ok: true, announcement: result.data })
  }

  if (
    parsed.data.channel === "notification" ||
    parsed.data.channel === "both"
  ) {
    const notificationResult = await auth.supabase
      .from("notifications")
      .insert({
        message: `${parsed.data.title}: ${parsed.data.message}`,
        admin_id: adminId,
      })

    if (notificationResult.error) {
      return NextResponse.json(
        { error: notificationResult.error.message },
        { status: 500 }
      )
    }
  }

  if (parsed.data.channel === "email" || parsed.data.channel === "both") {
    const recipients = await getTenantEmailRecipients({
      adminId,
      target: parsed.data.target,
    })
    const deliveryResults = await sendTrackedEmails(
      recipients.map((recipient) => ({
        adminId,
        actor: {
          type: "admin" as const,
          userId: auth.identity.userId,
          name: auth.identity.displayName,
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
          id: result.data.id,
        },
      }))
    )
    const failedCount = deliveryResults.filter(
      (delivery) => !delivery.ok
    ).length

    if (failedCount === 0 && recipients.length > 0) {
      await auth.supabase
        .from("announcements")
        .update({
          status: "Sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", result.data.id)
    }

    return NextResponse.json({
      ok: true,
      announcement: result.data,
      recipients: recipients.length,
      failed: failedCount,
      warning:
        recipients.length === 0
          ? "The selected audience has no active email recipients."
          : failedCount > 0
            ? "Some email deliveries failed. Review Email sending in Superadmin."
            : undefined,
    })
  }

  return NextResponse.json({ ok: true, announcement: result.data })
}

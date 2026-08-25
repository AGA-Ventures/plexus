import { Resend } from "resend"
import { z } from "zod"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const eventSchema = z.object({
  type: z.string().min(1),
  created_at: z.string().min(1),
  data: z
    .object({
      email_id: z.string().min(1),
      to: z.array(z.string()).optional(),
      bounce: z
        .object({
          message: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
    })
    .passthrough(),
})

const deliveryStatusByEvent = {
  "email.scheduled": "scheduled",
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.suppressed": "suppressed",
  "email.failed": "failed",
  "email.canceled": "canceled",
} as const

function eventDetail(event: z.infer<typeof eventSchema>) {
  if (event.type === "email.bounced" && event.data.bounce?.message) {
    return event.data.bounce.message.slice(0, 500)
  }

  return `Resend reported ${event.type.replace("email.", "")}.`
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim()

  if (!webhookSecret) {
    return Response.json(
      { error: "Resend webhook is not configured." },
      { status: 503 }
    )
  }

  const payload = await request.text()
  const eventId = request.headers.get("svix-id")
  const timestamp = request.headers.get("svix-timestamp")
  const signature = request.headers.get("svix-signature")

  if (!eventId || !timestamp || !signature) {
    return Response.json({ error: "Invalid webhook headers." }, { status: 400 })
  }

  let verified: unknown

  try {
    verified = new Resend().webhooks.verify({
      payload,
      headers: {
        id: eventId,
        timestamp,
        signature,
      },
      webhookSecret,
    })
  } catch {
    return Response.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    )
  }

  const parsed = eventSchema.safeParse(verified)

  if (!parsed.success) {
    return Response.json(
      { error: "Unsupported webhook payload." },
      { status: 400 }
    )
  }

  const adminClient = createSupabaseAdminClient()
  const deliveryResult = await adminClient
    .from("email_deliveries")
    .select("id")
    .eq("provider_message_id", parsed.data.data.email_id)
    .maybeSingle()

  if (deliveryResult.error) {
    return Response.json({ error: "Delivery lookup failed." }, { status: 500 })
  }

  if (!deliveryResult.data) {
    return Response.json({ ok: true, matched: false })
  }

  const occurredDate = new Date(parsed.data.created_at)

  if (Number.isNaN(occurredDate.getTime())) {
    return Response.json(
      { error: "Unsupported webhook timestamp." },
      { status: 400 }
    )
  }

  const occurredAt = occurredDate.toISOString()
  const eventInsert = await adminClient.from("email_delivery_events").insert({
    delivery_id: deliveryResult.data.id,
    provider_event_id: eventId,
    event_type: parsed.data.type,
    occurred_at: occurredAt,
    event_data: {
      bounce_type: parsed.data.data.bounce?.type ?? null,
    },
  })

  const duplicate = eventInsert.error?.code === "23505"

  if (eventInsert.error && !duplicate) {
    return Response.json(
      { error: "Webhook event could not be stored." },
      { status: 500 }
    )
  }

  const lifecycleStatus =
    deliveryStatusByEvent[
      parsed.data.type as keyof typeof deliveryStatusByEvent
    ]
  const update: Record<string, string> = {
    last_event_at: occurredAt,
    status_detail: eventDetail(parsed.data),
  }

  if (lifecycleStatus) {
    update.status = lifecycleStatus
  }
  if (parsed.data.type === "email.sent") {
    update.sent_at = occurredAt
  }
  if (parsed.data.type === "email.delivered") {
    update.delivered_at = occurredAt
  }
  if (parsed.data.type === "email.opened") {
    update.opened_at = occurredAt
  }
  if (parsed.data.type === "email.clicked") {
    update.clicked_at = occurredAt
  }
  if (
    [
      "email.bounced",
      "email.complained",
      "email.suppressed",
      "email.failed",
    ].includes(parsed.data.type)
  ) {
    update.failed_at = occurredAt
  }

  const updateResult = await adminClient
    .from("email_deliveries")
    .update(update)
    .eq("id", deliveryResult.data.id)

  if (updateResult.error) {
    return Response.json(
      { error: "Delivery status could not be updated." },
      { status: 500 }
    )
  }

  return Response.json({ ok: true, matched: true, duplicate })
}

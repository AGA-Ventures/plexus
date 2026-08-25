import "server-only"

import { Resend } from "resend"

import type { AppRole } from "@/lib/auth"
import type {
  EmailDeliveryStatus,
  EmailSenderType,
  EmailTriggerKey,
} from "@/lib/email-delivery"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type RecipientRole = AppRole | "external" | "unknown"

type EmailActor = {
  type: EmailSenderType
  userId?: string
  name: string
}

type EmailRecipient = {
  email: string
  name?: string
  role?: RecipientRole
}

type EmailSource = {
  table?: string
  id?: string
}

type SendTrackedEmailInput = {
  adminId?: string
  actor: EmailActor
  recipient: EmailRecipient
  trigger: EmailTriggerKey
  subject: string
  text: string
  html?: string
  source?: EmailSource
}

type SendTrackedAuthEmailInput = {
  adminId?: string
  actor: EmailActor
  recipient: EmailRecipient
  trigger:
    | "password_reset"
    | "admin_recovery"
    | "vendor_setup"
    | "vendor_setup_resend"
    | "account_setup"
  subject: string
  redirectTo: string
  source?: EmailSource
}

type DeliveryInsert = {
  id: string
  admin_id: string | null
  sender_type: EmailSenderType
  sender_user_id: string | null
  sender_name: string
  from_address: string
  recipient_email: string
  recipient_name: string
  recipient_role: RecipientRole
  trigger_key: EmailTriggerKey
  subject: string
  provider: "resend" | "supabase_auth"
  status: EmailDeliveryStatus
  status_detail: string
  source_table: string | null
  source_id: string | null
  idempotency_key: string
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function getResendFromAddress() {
  return (
    process.env.PLEXUS_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    ""
  )
}

export function getEmailProviderReadiness() {
  return {
    resendApiConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    resendFromConfigured: Boolean(getResendFromAddress()),
    resendWebhookConfigured: Boolean(process.env.RESEND_WEBHOOK_SECRET?.trim()),
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function renderPlexusEmail({
  title,
  message,
  actionLabel,
  actionUrl,
}: {
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
}) {
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br />")
  const action =
    actionLabel && actionUrl
      ? `<p style="margin:24px 0 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;border-radius:6px;background:#0f766e;color:#ffffff;padding:11px 18px;text-decoration:none;font-weight:600">${escapeHtml(actionLabel)}</a></p>`
      : ""

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f4f7f7;font-family:Arial,sans-serif;color:#17252a">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(title)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7f7;padding:32px 16px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #dce5e5;border-radius:10px">
            <tr>
              <td style="padding:28px">
                <p style="margin:0 0 10px;color:#0f766e;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Plexus</p>
                <h1 style="margin:0;font-size:24px;line-height:1.3">${escapeHtml(title)}</h1>
                <p style="margin:18px 0 0;font-size:15px;line-height:1.65;color:#43565c">${safeMessage}</p>
                ${action}
                <p style="margin:28px 0 0;border-top:1px solid #e7eeee;padding-top:18px;font-size:12px;line-height:1.5;color:#6c7f84">This operational email was sent by Plexus. Please contact your workspace support team if you did not expect it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

async function insertDelivery(input: DeliveryInsert) {
  const result = await createSupabaseAdminClient()
    .from("email_deliveries")
    .insert(input)

  if (result.error) {
    console.error("Email delivery tracking insert failed.", {
      code: result.error.code,
    })
  }

  return !result.error
}

async function updateDelivery(
  id: string,
  values: Record<string, string | null>
) {
  const result = await createSupabaseAdminClient()
    .from("email_deliveries")
    .update(values)
    .eq("id", id)

  if (result.error) {
    console.error("Email delivery tracking update failed.", {
      code: result.error.code,
    })
  }
}

function createDeliveryInsert({
  id,
  input,
  provider,
  fromAddress,
  status,
}: {
  id: string
  input: SendTrackedEmailInput | SendTrackedAuthEmailInput
  provider: DeliveryInsert["provider"]
  fromAddress: string
  status: EmailDeliveryStatus
}): DeliveryInsert {
  return {
    id,
    admin_id: input.adminId ?? null,
    sender_type: input.actor.type,
    sender_user_id: input.actor.userId ?? null,
    sender_name: input.actor.name,
    from_address: fromAddress,
    recipient_email: normalizeEmail(input.recipient.email),
    recipient_name: input.recipient.name?.trim() ?? "",
    recipient_role: input.recipient.role ?? "unknown",
    trigger_key: input.trigger,
    subject: input.subject,
    provider,
    status,
    status_detail: "",
    source_table: input.source?.table ?? null,
    source_id: input.source?.id ?? null,
    idempotency_key: `plexus/${input.trigger}/${id}`,
  }
}

export async function sendTrackedEmail(input: SendTrackedEmailInput) {
  const id = crypto.randomUUID()
  const from = getResendFromAddress()
  const delivery = createDeliveryInsert({
    id,
    input,
    provider: "resend",
    fromAddress: from,
    status: "queued",
  })
  const tracked = await insertDelivery(delivery)
  const readiness = getEmailProviderReadiness()

  if (!tracked) {
    return {
      ok: false as const,
      deliveryId: id,
      error: "Email delivery tracking is unavailable.",
    }
  }

  if (!readiness.resendApiConfigured || !readiness.resendFromConfigured) {
    await updateDelivery(id, {
      status: "failed",
      status_detail:
        "Resend is not fully configured. Add RESEND_API_KEY and PLEXUS_EMAIL_FROM.",
      failed_at: new Date().toISOString(),
      last_event_at: new Date().toISOString(),
    })

    return {
      ok: false as const,
      deliveryId: id,
      error: "Resend is not fully configured.",
    }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send(
      {
        from,
        to: [normalizeEmail(input.recipient.email)],
        subject: input.subject,
        text: input.text,
        html:
          input.html ??
          renderPlexusEmail({
            title: input.subject,
            message: input.text,
          }),
        tags: [
          { name: "trigger", value: input.trigger.replaceAll("/", "-") },
          { name: "delivery_id", value: id },
        ],
      },
      { idempotencyKey: delivery.idempotency_key }
    )

    if (result.error || !result.data?.id) {
      const detail =
        result.error?.message ?? "Resend did not return a message identifier."

      await updateDelivery(id, {
        status: "failed",
        status_detail: detail.slice(0, 500),
        failed_at: new Date().toISOString(),
        last_event_at: new Date().toISOString(),
      })

      return { ok: false as const, deliveryId: id, error: detail }
    }

    const sentAt = new Date().toISOString()

    await updateDelivery(id, {
      provider_message_id: result.data.id,
      status: "sent",
      status_detail: "Accepted by Resend for delivery.",
      sent_at: sentAt,
      last_event_at: sentAt,
    })

    return {
      ok: true as const,
      deliveryId: id,
      providerMessageId: result.data.id,
    }
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Resend request failed."

    await updateDelivery(id, {
      status: "failed",
      status_detail: detail.slice(0, 500),
      failed_at: new Date().toISOString(),
      last_event_at: new Date().toISOString(),
    })

    return { ok: false as const, deliveryId: id, error: detail }
  }
}

export async function sendTrackedSupabaseAuthEmail(
  input: SendTrackedAuthEmailInput
) {
  try {
    const supabase = await createSupabaseServerClient()
    const result = await supabase.auth.resetPasswordForEmail(
      normalizeEmail(input.recipient.email),
      { redirectTo: input.redirectTo }
    )
    const deliveryId = await recordTrackedSupabaseAuthEmail(input, {
      errorCode: result.error?.code,
    })

    return result.error
      ? { ok: false as const, deliveryId, error: result.error }
      : { ok: true as const, deliveryId }
  } catch (error) {
    const deliveryId = await recordTrackedSupabaseAuthEmail(input, {
      errorCode: "request_failed",
    })

    return { ok: false as const, deliveryId, error }
  }
}

export async function recordTrackedSupabaseAuthEmail(
  input: SendTrackedAuthEmailInput,
  result: { errorCode?: string }
) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const failed = Boolean(result.errorCode)
  const delivery = createDeliveryInsert({
    id,
    input,
    provider: "supabase_auth",
    fromAddress: "Supabase Auth",
    status: failed ? "failed" : "requested",
  })

  delivery.status_detail = failed
    ? `Supabase Auth rejected the request (${result.errorCode}).`
    : "Supabase Auth accepted the request. SMTP delivery is managed by the configured Auth provider."

  const tracked = await insertDelivery(delivery)

  if (tracked) {
    await updateDelivery(id, {
      last_event_at: now,
      failed_at: failed ? now : null,
    })
  }

  return id
}

export async function resolveTrackedRecipient(email: string) {
  const result = await createSupabaseAdminClient()
    .from("user_profiles")
    .select("id, display_name, email, role, admin_id")
    .eq("email", normalizeEmail(email))
    .maybeSingle()

  if (result.error || !result.data) {
    return null
  }

  return {
    id: result.data.id as string,
    adminId: (result.data.admin_id as string | null) ?? undefined,
    recipient: {
      email: result.data.email as string,
      name: result.data.display_name as string,
      role: result.data.role as AppRole,
    },
  }
}

export async function getTenantEmailRecipients({
  adminId,
  target,
}: {
  adminId: string
  target: "all" | "delegation" | "partner" | "admin"
}) {
  let query = createSupabaseAdminClient()
    .from("user_profiles")
    .select("id, display_name, email, role, vendor_type")
    .eq("admin_id", adminId)
    .eq("active", true)

  if (target === "admin") {
    query = query.eq("role", "admin")
  } else if (target === "delegation" || target === "partner") {
    query = query.eq("role", "vendor").eq("vendor_type", target)
  }

  const result = await query.order("email", { ascending: true })

  if (result.error) {
    throw new Error("The email audience could not be resolved.")
  }

  return (result.data ?? []).map((row) => ({
    id: row.id as string,
    email: row.email as string,
    name: row.display_name as string,
    role: row.role as AppRole,
  }))
}

export async function sendTrackedEmails(
  inputs: SendTrackedEmailInput[],
  concurrency = 10
) {
  const results: Awaited<ReturnType<typeof sendTrackedEmail>>[] = []

  for (let index = 0; index < inputs.length; index += concurrency) {
    const chunk = inputs.slice(index, index + concurrency)
    results.push(...(await Promise.all(chunk.map(sendTrackedEmail))))
  }

  return results
}

export async function sendTrackedMatchActivityEmail({
  matchId,
  actor,
  trigger,
  subject,
  text,
  source,
  includeAdmins = false,
}: {
  matchId: string
  actor: EmailActor
  trigger:
    | "match_activity"
    | "meeting_activity"
    | "mou_activity"
    | "scheduled_reminder"
  subject: string
  text: string
  source: EmailSource
  includeAdmins?: boolean
}) {
  const adminClient = createSupabaseAdminClient()
  const matchResult = await adminClient
    .from("matches")
    .select("admin_id, delegation_company_id, partner_company_id")
    .eq("id", matchId)
    .maybeSingle()

  if (matchResult.error || !matchResult.data) {
    return []
  }

  const match = matchResult.data
  const profilesResult = await adminClient
    .from("user_profiles")
    .select(
      "id, display_name, email, role, vendor_company_id, admin_id, active"
    )
    .eq("admin_id", match.admin_id)
    .eq("active", true)

  if (profilesResult.error) {
    return []
  }

  const recipients = (profilesResult.data ?? []).filter((profile) => {
    if (profile.role === "admin") {
      return includeAdmins
    }

    return (
      profile.role === "vendor" &&
      [match.delegation_company_id, match.partner_company_id].includes(
        profile.vendor_company_id
      )
    )
  })

  return sendTrackedEmails(
    recipients.map((recipient) => ({
      adminId: match.admin_id,
      actor,
      recipient: {
        email: recipient.email,
        name: recipient.display_name,
        role: recipient.role as AppRole,
      },
      trigger,
      subject,
      text,
      html: renderPlexusEmail({
        title: subject,
        message: text,
      }),
      source,
    }))
  )
}

export async function sendTrackedMeetingActivityEmail({
  meetingId,
  actor,
  trigger = "meeting_activity",
  subject,
  text,
  source,
  includeAdmins = false,
}: {
  meetingId: string
  actor: EmailActor
  trigger?: "meeting_activity" | "mou_activity" | "scheduled_reminder"
  subject: string
  text: string
  source: EmailSource
  includeAdmins?: boolean
}) {
  const result = await createSupabaseAdminClient()
    .from("meetings")
    .select("match_id")
    .eq("id", meetingId)
    .maybeSingle()

  if (result.error || !result.data) {
    return []
  }

  return sendTrackedMatchActivityEmail({
    matchId: result.data.match_id,
    actor,
    trigger,
    subject,
    text,
    source,
    includeAdmins,
  })
}

export async function sendTrackedDealActivityEmail({
  dealId,
  actor,
  subject,
  text,
  includeAdmins = true,
  trigger = "mou_activity",
}: {
  dealId: string
  actor: EmailActor
  subject: string
  text: string
  includeAdmins?: boolean
  trigger?: "mou_activity" | "scheduled_reminder"
}) {
  const result = await createSupabaseAdminClient()
    .from("deals")
    .select("match_id")
    .eq("id", dealId)
    .maybeSingle()

  if (result.error || !result.data) {
    return []
  }

  return sendTrackedMatchActivityEmail({
    matchId: result.data.match_id,
    actor,
    trigger,
    subject,
    text,
    source: {
      table: "deals",
      id: dealId,
    },
    includeAdmins,
  })
}

export async function sendTrackedVendorActivityEmail({
  vendorId,
  actor,
  subject,
  text,
  source,
  includeAdmins = false,
}: {
  vendorId: string
  actor: EmailActor
  subject: string
  text: string
  source: EmailSource
  includeAdmins?: boolean
}) {
  const adminClient = createSupabaseAdminClient()
  const vendorResult = await adminClient
    .from("vendor_companies")
    .select("admin_id")
    .eq("id", vendorId)
    .maybeSingle()

  if (vendorResult.error || !vendorResult.data) {
    return []
  }

  const adminId = vendorResult.data.admin_id
  const profilesResult = await adminClient
    .from("user_profiles")
    .select("display_name, email, role, vendor_company_id")
    .eq("admin_id", adminId)
    .eq("active", true)

  if (profilesResult.error) {
    return []
  }

  const recipients = (profilesResult.data ?? []).filter(
    (profile) =>
      (profile.role === "vendor" && profile.vendor_company_id === vendorId) ||
      (includeAdmins && profile.role === "admin")
  )

  return sendTrackedEmails(
    recipients.map((recipient) => ({
      adminId,
      actor,
      recipient: {
        email: recipient.email,
        name: recipient.display_name,
        role: recipient.role as AppRole,
      },
      trigger: "operations_activity",
      subject,
      text,
      html: renderPlexusEmail({
        title: subject,
        message: text,
      }),
      source,
    }))
  )
}

export async function sendTrackedTenantActivityEmail({
  adminId,
  actor,
  target,
  subject,
  text,
  source,
  trigger = "operations_activity",
}: {
  adminId: string
  actor: EmailActor
  target: "all" | "delegation" | "partner" | "admin"
  subject: string
  text: string
  source: EmailSource
  trigger?: "operations_activity" | "scheduled_reminder"
}) {
  const recipients = await getTenantEmailRecipients({ adminId, target })

  return sendTrackedEmails(
    recipients.map((recipient) => ({
      adminId,
      actor,
      recipient,
      trigger,
      subject,
      text,
      html: renderPlexusEmail({
        title: subject,
        message: text,
      }),
      source,
    }))
  )
}

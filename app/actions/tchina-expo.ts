"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

type TChinaActionResult = { ok: boolean; error?: string }

const localeSchema = z.enum(["en", "zh", "zh-Hant", "th"])
const eventSchema = z
  .object({
    locale: localeSchema,
    title: z.string().trim().min(2).max(160),
    venueName: z.string().trim().max(240),
    venueAddress: z.string().trim().max(500),
    organizerName: z.string().trim().max(240),
    supportEmail: z.union([z.literal(""), z.email().trim().max(320)]),
    registrationOpen: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.registrationOpen) return
    const required = [
      ["venueName", value.venueName],
      ["venueAddress", value.venueAddress],
      ["organizerName", value.organizerName],
      ["supportEmail", value.supportEmail],
    ] as const
    required.forEach(([field, value]) => {
      if (!value) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Complete this field before opening registration.",
        })
      }
    })
  })

const registrationActionSchema = z.object({
  locale: localeSchema,
  registrationId: z.uuid(),
})

async function requireSuperadmin() {
  const authorization = await getAuthenticatedIdentity()
  if (!authorization.ok) throw new Error(authorization.error)
  if (authorization.identity.role !== "superadmin") {
    throw new Error("Active Superadmin access is required.")
  }
  return authorization
}

function refresh(locale: string) {
  revalidatePath(`/${locale}/superadmin`)
  revalidatePath("/en/tchina-expo")
  revalidatePath("/zh/tchina-expo")
}

export async function saveTChinaEventAction(
  input: unknown
): Promise<TChinaActionResult> {
  const parsed = eventSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message }
  }

  try {
    const { identity } = await requireSuperadmin()

    const adminClient = createSupabaseAdminClient()
    const beforeResult = await adminClient
      .from("tchina_events")
      .select("*")
      .eq("singleton_key", "plexus")
      .maybeSingle()
    const values = {
      singleton_key: "plexus",
      title: parsed.data.title,
      city: "Guangzhou",
      venue_name: parsed.data.venueName,
      venue_address: parsed.data.venueAddress,
      organizer_name: parsed.data.organizerName,
      support_email: parsed.data.supportEmail,
      starts_on: "2026-08-31",
      ends_on: "2026-09-04",
      timezone: "Asia/Shanghai",
      registration_open: parsed.data.registrationOpen,
    }
    const eventResult = await adminClient
      .from("tchina_events")
      .upsert(values, { onConflict: "singleton_key" })
      .select("id")
      .single()

    if (eventResult.error)
      return { ok: false, error: eventResult.error.message }

    await adminClient.from("audit_events").insert({
      actor_user_id: identity.userId,
      actor_role: "superadmin",
      action: parsed.data.registrationOpen
        ? "publish_tchina_event"
        : "update_tchina_event",
      target_table: "tchina_events",
      target_id: eventResult.data.id,
      admin_id: null,
      before_values: beforeResult.data ?? null,
      after_values: values,
    })

    refresh(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Event setup failed.",
    }
  }
}

export async function rejectTChinaRegistrationAction(
  input: unknown
): Promise<TChinaActionResult> {
  const parsed = registrationActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid registration." }

  try {
    const { identity } = await requireSuperadmin()
    const adminClient = createSupabaseAdminClient()
    const registrationResult = await adminClient
      .from("event_registrations")
      .select("id, status, attendee_type")
      .eq("id", parsed.data.registrationId)
      .eq("status", "pending")
      .maybeSingle()

    if (registrationResult.error || !registrationResult.data) {
      return { ok: false, error: "This registration is no longer pending." }
    }

    const reviewedAt = new Date().toISOString()
    const updateResult = await adminClient
      .from("event_registrations")
      .update({
        status: "rejected",
        reviewed_by: identity.userId,
        reviewed_at: reviewedAt,
      })
      .eq("id", parsed.data.registrationId)
      .eq("status", "pending")

    if (updateResult.error)
      return { ok: false, error: updateResult.error.message }

    await adminClient.from("audit_events").insert({
      actor_user_id: identity.userId,
      actor_role: "superadmin",
      action: "reject_tchina_registration",
      target_table: "event_registrations",
      target_id: parsed.data.registrationId,
      admin_id: null,
      before_values: { status: "pending" },
      after_values: {
        status: "rejected",
        attendee_type: registrationResult.data.attendee_type,
      },
    })

    refresh(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Rejection failed.",
    }
  }
}

export async function deleteTChinaRegistrationAction(
  input: unknown
): Promise<TChinaActionResult> {
  const parsed = registrationActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid registration." }

  try {
    const { identity } = await requireSuperadmin()
    const adminClient = createSupabaseAdminClient()
    const registrationResult = await adminClient
      .from("event_registrations")
      .select(
        "id, reference_code, status, attendee_type, vendor_company_id, auth_user_id"
      )
      .eq("id", parsed.data.registrationId)
      .maybeSingle()

    if (registrationResult.error || !registrationResult.data) {
      return { ok: false, error: "Registration was not found." }
    }

    await adminClient.from("audit_events").insert({
      actor_user_id: identity.userId,
      actor_role: "superadmin",
      action: "delete_tchina_registration",
      target_table: "event_registrations",
      target_id: parsed.data.registrationId,
      admin_id: null,
      before_values: registrationResult.data,
      after_values: {
        deleted: true,
        linked_accounts_preserved: true,
      },
    })
    const deleteResult = await adminClient
      .from("event_registrations")
      .delete()
      .eq("id", parsed.data.registrationId)

    if (deleteResult.error)
      return { ok: false, error: deleteResult.error.message }

    refresh(parsed.data.locale)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Deletion failed.",
    }
  }
}

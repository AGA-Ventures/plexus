import { NextResponse } from "next/server"

import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getPublishedTChinaEvent } from "@/lib/tchina-expo-server"
import {
  createTChinaReference,
  genericTChinaRegistrationSuccess,
  normalizeTChinaEmail,
  normalizeTChinaPhone,
  tchinaRegistrationRequestSchema,
} from "@/lib/tchina-expo"

const maximumRequestBytes = 64 * 1024

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0)

  if (contentLength > maximumRequestBytes) {
    return json({ ok: false, error: "Request body is too large." }, 413)
  }

  let body: unknown

  try {
    const rawBody = await request.text()
    if (Buffer.byteLength(rawBody, "utf8") > maximumRequestBytes) {
      return json({ ok: false, error: "Request body is too large." }, 413)
    }
    body = JSON.parse(rawBody)
  } catch {
    return json({ ok: false, error: "Invalid JSON request." }, 400)
  }

  const parsed = tchinaRegistrationRequestSchema.safeParse(body)

  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "Check the highlighted information and try again.",
        fieldErrors: parsed.error.issues.reduce<Record<string, string>>(
          (errors, issue) => {
            const field = issue.path.join(".") || "form"
            errors[field] ??= issue.message
            return errors
          },
          {}
        ),
      },
      400
    )
  }

  // Bots receive the same response as a valid or duplicate submission.
  if (parsed.data.websiteConfirm) {
    return json(genericTChinaRegistrationSuccess)
  }

  const event = await getPublishedTChinaEvent()
  if (!event) {
    return json({ ok: false, error: "Registration is not open." }, 404)
  }

  const answers =
    parsed.data.attendeeType === "business_delegate"
      ? parsed.data.delegate
      : parsed.data.visitor

  try {
    const result = await createSupabaseAdminClient()
      .from("event_registrations")
      .insert({
        event_id: event.id,
        reference_code: createTChinaReference(),
        attendee_type: parsed.data.attendeeType,
        normalized_email: normalizeTChinaEmail(parsed.data.email),
        full_name: parsed.data.fullName,
        mobile_number: normalizeTChinaPhone(parsed.data.mobileNumber),
        chat_platform: parsed.data.chatPlatform,
        chat_id: parsed.data.chatId,
        country_region: parsed.data.countryRegion,
        preferred_language: parsed.data.preferredLanguage,
        attendance_dates: parsed.data.attendanceDates,
        answers,
        consented_at: new Date().toISOString(),
      })
      .select("id")
      .maybeSingle()

    if (result.error && result.error.code !== "23505") {
      console.error("TChina registration insert failed.", {
        code: result.error.code,
      })
      return json(
        { ok: false, error: "Registration could not be submitted." },
        500
      )
    }

    // Duplicate valid submissions deliberately receive the same response.
    return json(genericTChinaRegistrationSuccess)
  } catch {
    console.error("TChina registration request failed.")
    return json(
      { ok: false, error: "Registration could not be submitted." },
      500
    )
  }
}

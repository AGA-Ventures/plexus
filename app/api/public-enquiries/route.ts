import { NextResponse } from "next/server"

import {
  getPublicEnquiryFieldErrors,
  publicEnquiryRequestSchema,
} from "@/lib/public-enquiry"
import { sendPublicEnquiryEmail } from "@/lib/public-enquiry-email"

const maximumRequestBytes = 64 * 1024

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}

function isHoneypotSubmission(body: unknown) {
  if (!body || typeof body !== "object" || !("websiteConfirm" in body)) {
    return false
  }

  return (
    typeof body.websiteConfirm === "string" &&
    body.websiteConfirm.trim().length > 0
  )
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0)

  if (contentLength > maximumRequestBytes) {
    return json({ ok: false, error: "request_too_large" }, 413)
  }

  let body: unknown

  try {
    const rawBody = await request.text()

    if (Buffer.byteLength(rawBody, "utf8") > maximumRequestBytes) {
      return json({ ok: false, error: "request_too_large" }, 413)
    }

    body = JSON.parse(rawBody)
  } catch {
    return json({ ok: false, error: "invalid_request" }, 400)
  }

  // Bots receive the same success response as legitimate enquiries, even when
  // their remaining fields are malformed.
  if (isHoneypotSubmission(body)) {
    return json({ ok: true, submitted: true })
  }

  const parsed = publicEnquiryRequestSchema.safeParse(body)

  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "validation_failed",
        fieldErrors: getPublicEnquiryFieldErrors(parsed.error),
      },
      400
    )
  }

  const delivery = await sendPublicEnquiryEmail(parsed.data)

  if (!delivery.ok) {
    return json({ ok: false, error: delivery.reason }, 503)
  }

  return json({ ok: true, submitted: true })
}

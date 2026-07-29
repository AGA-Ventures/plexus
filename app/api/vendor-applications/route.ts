import { NextResponse } from "next/server"

import { getCompanyProfileCompletion } from "@/lib/company-profile"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getActiveVendorApplicationTenant } from "@/lib/vendor-application-server"
import {
  genericVendorApplicationSuccess,
  getVendorApplicationFieldErrors,
  normalizeVendorApplicationEmail,
  vendorApplicationRequestSchema,
} from "@/lib/vendor-applications"

const maximumRequestBytes = 64 * 1024

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
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

  const parsed = vendorApplicationRequestSchema.safeParse(body)

  if (!parsed.success) {
    return json(
      {
        ok: false,
        error: "Check the highlighted fields and try again.",
        fieldErrors: getVendorApplicationFieldErrors(parsed.error),
      },
      400
    )
  }

  // A completed honeypot receives the same success response as a legitimate
  // submission, but no data is stored.
  if (parsed.data.websiteConfirm) {
    return json(genericVendorApplicationSuccess)
  }

  try {
    const tenant = await getActiveVendorApplicationTenant(
      parsed.data.tenantSlug
    )

    if (!tenant) {
      return json({ ok: false, error: "Signup link is unavailable." }, 404)
    }

    const profileComplete = getCompanyProfileCompletion(
      parsed.data.profile
    ).percentage
    const result = await createSupabaseAdminClient()
      .from("vendor_applications")
      .insert({
        admin_id: tenant.id,
        vendor_type: parsed.data.vendorType,
        normalized_email: normalizeVendorApplicationEmail(
          parsed.data.profile.contactEmail
        ),
        contact_name: parsed.data.profile.contactName,
        company_name: parsed.data.profile.companyNameEn,
        profile_data: parsed.data.profile,
        profile_complete: profileComplete,
      })

    if (result.error && result.error.code !== "23505") {
      console.error("Vendor application insert failed.", {
        code: result.error.code,
      })
      return json(
        {
          ok: false,
          error: "The application could not be submitted. Try again.",
        },
        500
      )
    }

    // Duplicate valid submissions deliberately receive the same response.
    return json(genericVendorApplicationSuccess)
  } catch {
    console.error("Vendor application request failed.")
    return json(
      {
        ok: false,
        error: "The application could not be submitted. Try again.",
      },
      500
    )
  }
}

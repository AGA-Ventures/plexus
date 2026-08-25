import { NextResponse } from "next/server"
import { after } from "next/server"

import { getCompanyProfileCompletion } from "@/lib/company-profile"
import {
  getTenantEmailRecipients,
  renderPlexusEmail,
  sendTrackedEmail,
  sendTrackedEmails,
} from "@/lib/email-delivery-service"
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
      parsed.data.profile,
      { includeMeetingArrangement: false }
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
      .select("id")
      .maybeSingle()

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

    if (!result.error && result.data) {
      const applicationId = result.data.id
      const applicantEmail = normalizeVendorApplicationEmail(
        parsed.data.profile.contactEmail
      )
      const applicantName = parsed.data.profile.contactName
      const companyName = parsed.data.profile.companyNameEn

      after(async () => {
        const confirmationSubject = "Your Vendor application was received"
        const confirmationText = `${tenant.branding.name} received the Vendor application for ${companyName}. An Admin will review the submitted company information. You will receive another email when a decision is recorded.`
        const adminRecipients = await getTenantEmailRecipients({
          adminId: tenant.id,
          target: "admin",
        })

        await Promise.all([
          sendTrackedEmail({
            adminId: tenant.id,
            actor: {
              type: "plexus_system",
              name: "Plexus applications",
            },
            recipient: {
              email: applicantEmail,
              name: applicantName,
              role: "external",
            },
            trigger: "vendor_application_received",
            subject: confirmationSubject,
            text: confirmationText,
            html: renderPlexusEmail({
              title: confirmationSubject,
              message: confirmationText,
            }),
            source: {
              table: "vendor_applications",
              id: applicationId,
            },
          }),
          sendTrackedEmails(
            adminRecipients.map((recipient) => {
              const subject = `New Vendor application: ${companyName}`
              const text = `${applicantName} submitted a ${parsed.data.vendorType} Vendor application for ${companyName}. Sign in to the Admin workspace to review it.`

              return {
                adminId: tenant.id,
                actor: {
                  type: "plexus_system" as const,
                  name: "Plexus applications",
                },
                recipient,
                trigger: "vendor_application_received" as const,
                subject,
                text,
                html: renderPlexusEmail({
                  title: subject,
                  message: text,
                }),
                source: {
                  table: "vendor_applications",
                  id: applicationId,
                },
              }
            })
          ),
        ])
      })
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

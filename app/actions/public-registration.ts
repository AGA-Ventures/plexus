"use server"

import { revalidatePath } from "next/cache"

import { getCompanyProfileCompletion } from "@/lib/company-profile"
import type { CompanyRegistrationProfile } from "@/lib/local-db"
import {
  publicPartnerRegistrationSchema,
  type PublicPartnerRegistrationActionState,
} from "@/lib/public-partner-registration"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

const allowedLogoTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const maxLogoBytes = 2 * 1024 * 1024

function value(formData: FormData, name: string) {
  const item = formData.get(name)
  return typeof item === "string" ? item : ""
}

function logoExtension(file: File) {
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  return "jpg"
}

export async function submitPublicPartnerRegistrationAction(
  _previousState: PublicPartnerRegistrationActionState,
  formData: FormData
): Promise<PublicPartnerRegistrationActionState> {
  if (value(formData, "companyFax")) {
    return {
      ok: true,
      message:
        "Thank you. Your registration has been submitted for review.",
    }
  }

  const parsed = publicPartnerRegistrationSchema.safeParse({
    tenantSlug: value(formData, "tenantSlug"),
    companyName: value(formData, "companyName"),
    registrationNumber: value(formData, "registrationNumber"),
    website: value(formData, "website"),
    sector: value(formData, "sector"),
    introduction: value(formData, "introduction"),
    productsServices: value(formData, "productsServices"),
    lookingFor: value(formData, "lookingFor"),
    contactName: value(formData, "contactName"),
    contactPosition: value(formData, "contactPosition"),
    contactEmail: value(formData, "contactEmail"),
    mobileNumber: value(formData, "mobileNumber"),
  })

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      errors: Object.fromEntries(
        Object.entries(errors).map(([field, messages]) => [
          field,
          messages?.[0],
        ])
      ),
    }
  }

  const logoItem = formData.get("logo")
  const logo =
    logoItem instanceof File && logoItem.size > 0 ? logoItem : undefined

  if (logo && (!allowedLogoTypes.has(logo.type) || logo.size > maxLogoBytes)) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      errors: {
        logo: "Upload a JPG, PNG, or WebP logo no larger than 2 MB.",
      },
    }
  }

  try {
    const supabase = createSupabaseAdminClient()
    const tenantResult = await supabase
      .from("admin_tenants")
      .select("id, slug")
      .eq("slug", parsed.data.tenantSlug)
      .eq("status", "active")
      .maybeSingle()

    if (tenantResult.error || !tenantResult.data) {
      return {
        ok: false,
        message:
          "This registration link is unavailable. Ask the organizer for a current link.",
      }
    }

    const duplicateResult = await supabase
      .from("partner_companies")
      .select("id")
      .eq("admin_id", tenantResult.data.id)
      .eq("profile_data->>contactEmail", parsed.data.contactEmail)
      .in("verified", ["Pending", "Verified"])
      .limit(1)
      .maybeSingle()

    if (duplicateResult.error) {
      return {
        ok: false,
        message: "The registration service is temporarily unavailable.",
      }
    }

    if (duplicateResult.data) {
      return {
        ok: true,
        message:
          "Thank you. Your registration has been submitted for review.",
      }
    }

    const companyId = crypto.randomUUID()
    let logoUrl = ""
    let logoPath = ""

    if (logo) {
      logoPath = `${tenantResult.data.slug}/partner-registrations/${companyId}.${logoExtension(logo)}`
      const uploadResult = await supabase.storage
        .from("tenant-branding")
        .upload(logoPath, logo, {
          contentType: logo.type,
          upsert: false,
        })

      if (uploadResult.error) {
        return {
          ok: false,
          message: "The company logo could not be uploaded. Please try again.",
        }
      }

      logoUrl = supabase.storage
        .from("tenant-branding")
        .getPublicUrl(logoPath).data.publicUrl
    }

    const profile: CompanyRegistrationProfile & {
      companyLogoUrl?: string
      publicRegistration?: boolean
      lookingForSummary?: string
    } = {
      companyNameEn: parsed.data.companyName,
      companyNameCn: "",
      countryRegion: "Malaysia",
      countryOther: "",
      yearEstablished: "",
      registrationNumber: parsed.data.registrationNumber,
      website: parsed.data.website,
      address: "",
      employeeRange: "",
      annualRevenueRange: "",
      contactName: parsed.data.contactName,
      contactPosition: parsed.data.contactPosition,
      contactEmail: parsed.data.contactEmail,
      mobileNumber: parsed.data.mobileNumber,
      chatId: "",
      preferredLanguages: [],
      industries: [parsed.data.sector],
      industryOther: "",
      introduction: parsed.data.introduction,
      productsServices: parsed.data.productsServices,
      certifications: [],
      certificationOther: "",
      offers: [],
      offerOther: "",
      lookingFor: [],
      lookingForOther: parsed.data.lookingFor,
      preferredPartnerTypes: [],
      preferredPartnerOther: "",
      expectedOutcomes: [],
      idealPartner: "",
      opportunity: "",
      exportsInternationally: "",
      exportMarkets: "",
      meetingFormat: "",
      availableMeetingDates: "",
      maxMeetings: "",
      supportingDocuments: [],
      consent: false,
      consentName: "",
      consentDate: "",
      companyLogoUrl: logoUrl || undefined,
      publicRegistration: true,
      lookingForSummary: parsed.data.lookingFor,
    }

    const insertResult = await supabase.from("partner_companies").insert({
      id: companyId,
      vendor_company_id: companyId,
      admin_id: tenantResult.data.id,
      vendor_type: "partner",
      name_en: parsed.data.companyName,
      name_cn: "",
      sector: parsed.data.sector,
      partner_type: "Enterprise",
      company_size: "Pending",
      offerings: parsed.data.productsServices,
      contact: parsed.data.contactName,
      contact_meta: `Public registration · ${parsed.data.contactPosition} · ${parsed.data.contactEmail} · ${parsed.data.mobileNumber}`,
      status: "Invited",
      profile_complete: getCompanyProfileCompletion(profile).percentage,
      verified: "Pending",
      attendance: "Invited",
      arrived: false,
      profile_data: profile,
    })

    if (insertResult.error) {
      if (logoPath) {
        await supabase.storage.from("tenant-branding").remove([logoPath])
      }
      return {
        ok: false,
        message: "The registration could not be saved. Please try again.",
      }
    }

    await supabase.from("audit_events").insert({
      actor_user_id: null,
      actor_role: null,
      action: "submit_public_partner_registration",
      target_table: "partner_companies",
      target_id: companyId,
      admin_id: tenantResult.data.id,
      before_values: null,
      after_values: {
        source: "public_registration",
        contact_email: parsed.data.contactEmail,
      },
    })

    revalidatePath("/en/admin")
    revalidatePath("/zh/admin")
    revalidatePath("/zh-Hant/admin")
    revalidatePath("/th/admin")

    return {
      ok: true,
      message:
        "Thank you. Your registration has been submitted for review. The organizer will contact you after qualification.",
    }
  } catch {
    return {
      ok: false,
      message: "The registration service is temporarily unavailable.",
    }
  }
}

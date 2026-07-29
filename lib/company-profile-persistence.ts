import { getCompanyProfileCompletion } from "@/lib/company-profile"
import { getSubmittedCompanyIndustrySector } from "@/lib/industry-sectors"
import type { CompanyRegistrationProfile, CompanyRole } from "@/lib/local-db"

function getContactMeta(profile: CompanyRegistrationProfile) {
  return [
    profile.contactPosition,
    profile.contactEmail,
    profile.mobileNumber,
    profile.chatId,
  ]
    .filter(Boolean)
    .join(" · ")
}

export function buildCompanyProfilePersistence(
  kind: CompanyRole,
  profile: CompanyRegistrationProfile
) {
  const profileComplete = getCompanyProfileCompletion(profile).percentage
  const submittedSector = getSubmittedCompanyIndustrySector(profile)
  const common = {
    ...(submittedSector ? { sector: submittedSector } : {}),
    name_en: profile.companyNameEn,
    name_cn: profile.companyNameCn || profile.companyNameEn,
    company_size: profile.employeeRange || "Pending",
    contact: profile.contactName || "Pending contact",
    contact_meta: getContactMeta(profile),
    profile_complete: profileComplete,
    profile_data: profile,
  }

  if (kind === "delegation") {
    return {
      kind,
      values: {
        ...common,
        origin: profile.countryOther || profile.countryRegion || "Pending",
        needs: profile.opportunity || profile.idealPartner || "Pending profile",
        status:
          profileComplete >= 90 ? ("Locked" as const) : ("Incomplete" as const),
        urgent: !profile.consent,
      },
    }
  }

  return {
    kind,
    values: {
      ...common,
      offerings:
        profile.productsServices ||
        profile.offers.join(", ") ||
        "Pending profile",
      verified:
        profileComplete >= 90 && profile.consent
          ? ("Verified" as const)
          : ("Pending" as const),
    },
  }
}

export function buildApprovedCompanyInsert({
  adminId,
  vendorId,
  vendorType,
  profile,
}: {
  adminId: string
  vendorId: string
  vendorType: CompanyRole
  profile: CompanyRegistrationProfile
}) {
  const persistence = buildCompanyProfilePersistence(vendorType, profile)
  const common = {
    ...persistence.values,
    id: vendorId,
    admin_id: adminId,
    vendor_company_id: vendorId,
    vendor_type: vendorType,
  }

  if (persistence.kind === "delegation") {
    return {
      table: "delegation_companies" as const,
      values: {
        ...common,
        coordinator: profile.contactName,
      },
    }
  }

  return {
    table: "partner_companies" as const,
    values: {
      ...common,
      partner_type: "Enterprise" as const,
      status: "Invited" as const,
      attendance: "Invited" as const,
      arrived: false,
    },
  }
}

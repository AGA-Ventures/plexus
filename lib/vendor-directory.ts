import type { VendorType } from "@/lib/auth"

export type PartnerType = "Government" | "Association" | "Enterprise"

export type VendorDirectoryUpdateInput = {
  vendorType: VendorType
  nameEn: string
  nameCn: string
  sector: string
  companySize: string
  contactName: string
  contactDetails: string
  origin: string
  partnerType: PartnerType
  description: string
  coordinator: string
}

export function buildVendorDirectoryUpdate(input: VendorDirectoryUpdateInput) {
  const shared = {
    name_en: input.nameEn,
    name_cn: input.nameCn,
    sector: input.sector,
    company_size: input.companySize,
    contact: input.contactName,
    contact_meta: input.contactDetails,
  }

  if (input.vendorType === "delegation") {
    return {
      ...shared,
      origin: input.origin,
      needs: input.description,
      coordinator: input.coordinator,
    }
  }

  return {
    ...shared,
    partner_type: input.partnerType,
    offerings: input.description,
  }
}

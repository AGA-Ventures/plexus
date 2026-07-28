import { describe, expect, it } from "vitest"

import { buildVendorDirectoryUpdate } from "@/lib/vendor-directory"

const shared = {
  nameEn: "Example Industries",
  nameCn: "示例工业",
  sector: "Manufacturing",
  companySize: "51–200",
  contactName: "Alex Tan",
  contactDetails: "alex@example.com · +60 12 345 6789",
  origin: "Shanghai",
  partnerType: "Enterprise" as const,
  description: "Regional distribution and manufacturing partnerships",
  coordinator: "Plexus Operations",
}

describe("Vendor directory updates", () => {
  it("builds the complete Delegation profile without Partner-only fields", () => {
    expect(
      buildVendorDirectoryUpdate({
        ...shared,
        vendorType: "delegation",
      })
    ).toEqual({
      name_en: shared.nameEn,
      name_cn: shared.nameCn,
      sector: shared.sector,
      company_size: shared.companySize,
      contact: shared.contactName,
      contact_meta: shared.contactDetails,
      origin: shared.origin,
      needs: shared.description,
      coordinator: shared.coordinator,
    })
  })

  it("builds the complete Partner profile without Delegation-only fields", () => {
    expect(
      buildVendorDirectoryUpdate({
        ...shared,
        vendorType: "partner",
        partnerType: "Association",
      })
    ).toEqual({
      name_en: shared.nameEn,
      name_cn: shared.nameCn,
      sector: shared.sector,
      company_size: shared.companySize,
      contact: shared.contactName,
      contact_meta: shared.contactDetails,
      partner_type: "Association",
      offerings: shared.description,
    })
  })
})

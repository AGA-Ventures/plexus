import { describe, expect, it } from "vitest"

import {
  getCompanyName,
  getCompanySector,
  seedDb,
  type LocalDb,
} from "@/lib/local-db"

describe("match company summaries", () => {
  it("resolves the RLS-safe counterpart name and sector", () => {
    const db: LocalDb = {
      ...seedDb,
      delegationCompanies: [],
      partnerCompanies: [],
      matchCompanies: [
        {
          id: "counterpart-1",
          nameEn: "CBA",
          nameCn: "",
          sector: "Business Services",
        },
      ],
    }

    expect(getCompanyName(db, "counterpart-1")).toBe("CBA")
    expect(getCompanySector(db, "counterpart-1")).toBe("Business Services")
  })

  it("keeps the non-disclosing fallback for an unavailable company", () => {
    const db: LocalDb = {
      ...seedDb,
      delegationCompanies: [],
      partnerCompanies: [],
      matchCompanies: [],
    }

    expect(getCompanyName(db, "not-visible")).toBe("Unknown company")
    expect(getCompanySector(db, "not-visible")).toBe("")
  })
})

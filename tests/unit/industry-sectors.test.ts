import { describe, expect, it } from "vitest"

import {
  findIndustrySectorOption,
  getSubmittedCompanyIndustrySector,
  industrySectorGroups,
  industrySectorOptions,
  isPlaceholderIndustrySector,
  resolveCompanyIndustrySector,
} from "@/lib/industry-sectors"

describe("global industry sectors", () => {
  it("covers every UN ISIC Revision 5 section with unique divisions", () => {
    expect(industrySectorGroups).toHaveLength(22)
    expect(industrySectorOptions.length).toBeGreaterThanOrEqual(80)

    const codes = industrySectorOptions.map((industry) => industry.code)
    const labels = industrySectorOptions.map((industry) => industry.label)

    expect(new Set(codes).size).toBe(codes.length)
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels.every((label) => label.length <= 120)).toBe(true)
  })

  it("supports exact lookup for globally common industries", () => {
    expect(
      findIndustrySectorOption(
        "Computer programming, consultancy and related activities"
      )
    ).toMatchObject({
      code: "62",
      groupCode: "K",
    })

    expect(
      findIndustrySectorOption("Manufacture of food products")
    ).toMatchObject({
      code: "10",
      groupCode: "C",
    })
  })

  it("replaces legacy pending labels with the submitted profile sector", () => {
    expect(
      resolveCompanyIndustrySector("Pending profile", {
        industries: [
          "Computer programming, consultancy and related activities",
          "Retail trade",
        ],
      })
    ).toBe("Computer programming, consultancy and related activities")

    expect(
      resolveCompanyIndustrySector("Pending", {
        industries: [],
        industryOther: "Space commerce",
      })
    ).toBe("Space commerce")

    expect(resolveCompanyIndustrySector("Pending profile")).toBe("Not selected")
  })

  it("keeps a stored sector authoritative and identifies placeholders", () => {
    expect(
      resolveCompanyIndustrySector("Manufacture of food products", {
        industries: ["Retail trade"],
      })
    ).toBe("Manufacture of food products")
    expect(isPlaceholderIndustrySector(" pending PROFILE ")).toBe(true)
    expect(isPlaceholderIndustrySector("Manufacturing")).toBe(false)
  })

  it("leaves the sector untouched when a partial profile omits industry", () => {
    expect(
      getSubmittedCompanyIndustrySector({
        industries: [],
        industryOther: " ",
      })
    ).toBeUndefined()
  })
})

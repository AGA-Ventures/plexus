export type IndustrySectorOption = {
  code: string
  label: string
}

export type IndustrySectorGroup = {
  code: string
  label: string
  industries: readonly IndustrySectorOption[]
}

/**
 * United Nations International Standard Industrial Classification (ISIC),
 * Revision 5, at section and division level.
 *
 * Source: https://unstats.un.org/unsd/classifications/Econ/ISIC.cshtml
 */
export const industrySectorGroups: readonly IndustrySectorGroup[] = [
  {
    code: "A",
    label: "Agriculture, forestry and fishing",
    industries: [
      {
        code: "01",
        label:
          "Crop and animal production, hunting and related service activities",
      },
      { code: "02", label: "Forestry and logging" },
      { code: "03", label: "Fishing and aquaculture" },
    ],
  },
  {
    code: "B",
    label: "Mining and quarrying",
    industries: [
      { code: "05", label: "Mining of coal and lignite" },
      {
        code: "06",
        label: "Extraction of crude petroleum and natural gas",
      },
      { code: "07", label: "Mining of metal ores" },
      { code: "08", label: "Other mining and quarrying" },
      { code: "09", label: "Mining support service activities" },
    ],
  },
  {
    code: "C",
    label: "Manufacturing",
    industries: [
      { code: "10", label: "Manufacture of food products" },
      { code: "11", label: "Manufacture of beverages" },
      { code: "12", label: "Manufacture of tobacco products" },
      { code: "13", label: "Manufacture of textiles" },
      { code: "14", label: "Manufacture of wearing apparel" },
      { code: "15", label: "Manufacture of leather and related products" },
      {
        code: "16",
        label:
          "Manufacture of wood and products of wood and cork, except furniture",
      },
      { code: "17", label: "Manufacture of paper and paper products" },
      {
        code: "18",
        label: "Printing and reproduction of recorded media",
      },
      {
        code: "19",
        label: "Manufacture of coke and refined petroleum products",
      },
      {
        code: "20",
        label: "Manufacture of chemicals and chemical products",
      },
      {
        code: "21",
        label: "Manufacture of basic pharmaceutical products and preparations",
      },
      {
        code: "22",
        label: "Manufacture of rubber and plastic products",
      },
      {
        code: "23",
        label: "Manufacture of other non-metallic mineral products",
      },
      { code: "24", label: "Manufacture of basic metals" },
      {
        code: "25",
        label:
          "Manufacture of fabricated metal products, except machinery and equipment",
      },
      {
        code: "26",
        label: "Manufacture of computer, electronic and optical products",
      },
      { code: "27", label: "Manufacture of electrical equipment" },
      {
        code: "28",
        label: "Manufacture of machinery and equipment n.e.c.",
      },
      {
        code: "29",
        label: "Manufacture of motor vehicles, trailers and semi-trailers",
      },
      {
        code: "30",
        label: "Manufacture of other transport equipment",
      },
      { code: "31", label: "Manufacture of furniture" },
      { code: "32", label: "Other manufacturing" },
      {
        code: "33",
        label:
          "Repair, maintenance and installation of machinery and equipment",
      },
    ],
  },
  {
    code: "D",
    label: "Electricity, gas, steam and air conditioning supply",
    industries: [
      {
        code: "35",
        label: "Electricity, gas, steam and air conditioning supply",
      },
    ],
  },
  {
    code: "E",
    label: "Water supply, sewerage, waste management and remediation",
    industries: [
      { code: "36", label: "Water collection, treatment and supply" },
      { code: "37", label: "Sewerage" },
      {
        code: "38",
        label: "Waste collection, treatment, disposal and recovery",
      },
      {
        code: "39",
        label: "Remediation and other waste management services",
      },
    ],
  },
  {
    code: "F",
    label: "Construction",
    industries: [
      {
        code: "41",
        label: "Construction of residential and non-residential buildings",
      },
      { code: "42", label: "Civil engineering" },
      { code: "43", label: "Specialized construction activities" },
    ],
  },
  {
    code: "G",
    label: "Wholesale and retail trade",
    industries: [
      { code: "46", label: "Wholesale trade" },
      { code: "47", label: "Retail trade" },
    ],
  },
  {
    code: "H",
    label: "Transportation and storage",
    industries: [
      {
        code: "49",
        label: "Land transport and transport via pipelines",
      },
      { code: "50", label: "Water transport" },
      { code: "51", label: "Air transport" },
      {
        code: "52",
        label: "Warehousing and support activities for transportation",
      },
      { code: "53", label: "Postal and courier activities" },
    ],
  },
  {
    code: "I",
    label: "Accommodation and food service activities",
    industries: [
      { code: "55", label: "Accommodation" },
      { code: "56", label: "Food and beverage service activities" },
    ],
  },
  {
    code: "J",
    label: "Publishing, broadcasting and content production",
    industries: [
      { code: "58", label: "Publishing activities" },
      {
        code: "59",
        label:
          "Motion picture, video, television, sound recording and music publishing",
      },
      {
        code: "60",
        label:
          "Programming, broadcasting, news agency and content distribution",
      },
    ],
  },
  {
    code: "K",
    label: "Telecommunications, computing and information services",
    industries: [
      { code: "61", label: "Telecommunications" },
      {
        code: "62",
        label: "Computer programming, consultancy and related activities",
      },
      {
        code: "63",
        label:
          "Computing infrastructure, data processing, hosting and information services",
      },
    ],
  },
  {
    code: "L",
    label: "Financial and insurance activities",
    industries: [
      {
        code: "64",
        label: "Financial services, except insurance and pension funding",
      },
      {
        code: "65",
        label: "Insurance, reinsurance and pension funding",
      },
      {
        code: "66",
        label: "Activities auxiliary to financial and insurance services",
      },
    ],
  },
  {
    code: "M",
    label: "Real estate activities",
    industries: [{ code: "68", label: "Real estate activities" }],
  },
  {
    code: "N",
    label: "Professional, scientific and technical activities",
    industries: [
      { code: "69", label: "Legal and accounting activities" },
      {
        code: "70",
        label: "Head offices and management consultancy activities",
      },
      {
        code: "71",
        label:
          "Architectural, engineering, technical testing and analysis activities",
      },
      { code: "72", label: "Scientific research and development" },
      {
        code: "73",
        label: "Advertising, market research and public relations",
      },
      {
        code: "74",
        label: "Other professional, scientific and technical activities",
      },
      { code: "75", label: "Veterinary activities" },
    ],
  },
  {
    code: "O",
    label: "Administrative and support service activities",
    industries: [
      { code: "77", label: "Rental and leasing activities" },
      { code: "78", label: "Employment activities" },
      {
        code: "79",
        label: "Travel agency, tour operator and related activities",
      },
      { code: "80", label: "Investigation and security activities" },
      {
        code: "81",
        label: "Services to buildings and landscape activities",
      },
      {
        code: "82",
        label:
          "Office administration, office support and other business support",
      },
    ],
  },
  {
    code: "P",
    label: "Public administration and defence",
    industries: [
      {
        code: "84",
        label: "Public administration, defence and compulsory social security",
      },
    ],
  },
  {
    code: "Q",
    label: "Education",
    industries: [{ code: "85", label: "Education" }],
  },
  {
    code: "R",
    label: "Human health and social work activities",
    industries: [
      { code: "86", label: "Human health activities" },
      { code: "87", label: "Residential care activities" },
      {
        code: "88",
        label: "Social work activities without accommodation",
      },
    ],
  },
  {
    code: "S",
    label: "Arts, sports and recreation",
    industries: [
      { code: "90", label: "Arts creation and performing arts" },
      {
        code: "91",
        label: "Libraries, archives, museums and cultural activities",
      },
      { code: "92", label: "Gambling and betting activities" },
      {
        code: "93",
        label: "Sports, amusement and recreation activities",
      },
    ],
  },
  {
    code: "T",
    label: "Other service activities",
    industries: [
      { code: "94", label: "Activities of membership organizations" },
      {
        code: "95",
        label:
          "Repair and maintenance of computers, household goods and motor vehicles",
      },
      { code: "96", label: "Personal service activities" },
    ],
  },
  {
    code: "U",
    label: "Activities of households",
    industries: [
      {
        code: "97",
        label: "Activities of households as employers of domestic personnel",
      },
      {
        code: "98",
        label:
          "Goods- and services-producing activities of households for own use",
      },
    ],
  },
  {
    code: "V",
    label: "Activities of extraterritorial organizations and bodies",
    industries: [
      {
        code: "99",
        label: "Activities of extraterritorial organizations and bodies",
      },
    ],
  },
] as const

export const industrySectorOptions = industrySectorGroups.flatMap((group) =>
  group.industries.map((industry) => ({
    ...industry,
    groupCode: group.code,
    groupLabel: group.label,
  }))
)

export function findIndustrySectorOption(value: string) {
  return industrySectorOptions.find((industry) => industry.label === value)
}

export function isPlaceholderIndustrySector(value: string) {
  return ["pending", "pending profile", "not selected"].includes(
    value.trim().toLocaleLowerCase()
  )
}

export function getSubmittedCompanyIndustrySector(profile?: {
  industries?: string[]
  industryOther?: string
}) {
  const firstIndustry = profile?.industries
    ?.map((industry) => industry.trim())
    .find(Boolean)

  return firstIndustry || profile?.industryOther?.trim() || undefined
}

export function resolveCompanyIndustrySector(
  storedSector: string,
  profile?: {
    industries?: string[]
    industryOther?: string
  }
) {
  const normalizedStoredSector = storedSector.trim()

  if (
    normalizedStoredSector &&
    !isPlaceholderIndustrySector(normalizedStoredSector)
  ) {
    return normalizedStoredSector
  }

  return getSubmittedCompanyIndustrySector(profile) || "Not selected"
}

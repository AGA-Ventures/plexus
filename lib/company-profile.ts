import { z } from "zod"

import type { CompanyRegistrationProfile } from "@/lib/local-db"

export function getMalaysiaToday() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return `${value.year}-${value.month}-${value.day}`
}

const currentYear = Number(getMalaysiaToday().slice(0, 4))
const phonePattern = /^\+?[0-9][0-9().\s-]{5,29}$/

function isHttpUrl(value: string) {
  if (!value) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function isCalendarDate(value: string) {
  if (!value) {
    return true
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  )
}

function countWords(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export const registrationProfileSchema = z
  .object({
    companyNameEn: z
      .string()
      .trim()
      .min(1, "Enter the company name.")
      .max(240, "Use 240 characters or fewer."),
    companyNameCn: z.string().trim().max(240).default(""),
    countryRegion: z.string().trim().max(80).default(""),
    countryOther: z.string().trim().max(120).default(""),
    yearEstablished: z
      .string()
      .trim()
      .max(4)
      .refine(
        (value) =>
          !value ||
          (/^\d{4}$/.test(value) &&
            Number(value) >= 1800 &&
            Number(value) <= currentYear),
        `Enter a four-digit year from 1800 to ${currentYear}.`
      )
      .default(""),
    registrationNumber: z.string().trim().max(120).default(""),
    website: z
      .string()
      .trim()
      .max(240)
      .refine(
        isHttpUrl,
        "Enter a complete URL starting with http:// or https://."
      )
      .default(""),
    address: z.string().trim().max(500).default(""),
    employeeRange: z.string().trim().max(40).default(""),
    annualRevenueRange: z.string().trim().max(80).default(""),
    contactName: z.string().trim().max(160).default(""),
    contactPosition: z.string().trim().max(160).default(""),
    contactEmail: z
      .email("Enter a valid email address.")
      .or(z.literal(""))
      .default(""),
    mobileNumber: z
      .string()
      .trim()
      .max(30)
      .refine(
        (value) => !value || phonePattern.test(value),
        "Enter a valid phone number using digits and an optional country code."
      )
      .default(""),
    chatId: z.string().trim().max(120).default(""),
    preferredLanguages: z.array(z.string().trim().max(40)).default([]),
    industries: z.array(z.string().trim().max(120)).default([]),
    industryOther: z.string().trim().max(160).default(""),
    introduction: z
      .string()
      .trim()
      .max(3000)
      .refine(
        (value) =>
          !value || (countWords(value) >= 100 && countWords(value) <= 200),
        "Use 100 to 200 words."
      )
      .default(""),
    productsServices: z.string().trim().max(3000).default(""),
    certifications: z.array(z.string().trim().max(80)).default([]),
    certificationOther: z.string().trim().max(160).default(""),
    offers: z.array(z.string().trim().max(100)).default([]),
    offerOther: z.string().trim().max(160).default(""),
    lookingFor: z.array(z.string().trim().max(120)).default([]),
    lookingForOther: z.string().trim().max(160).default(""),
    preferredPartnerTypes: z.array(z.string().trim().max(120)).default([]),
    preferredPartnerOther: z.string().trim().max(160).default(""),
    expectedOutcomes: z.array(z.string().trim().max(120)).default([]),
    idealPartner: z.string().trim().max(2500).default(""),
    opportunity: z.string().trim().max(2500).default(""),
    exportsInternationally: z.string().trim().max(12).default(""),
    exportMarkets: z.string().trim().max(1000).default(""),
    meetingFormat: z.string().trim().max(40).default(""),
    availableMeetingDates: z.string().trim().max(1000).default(""),
    maxMeetings: z.string().trim().max(40).default(""),
    supportingDocuments: z.array(z.string().trim().max(120)).default([]),
    consent: z.boolean().default(false),
    consentName: z.string().trim().max(160).default(""),
    consentDate: z
      .string()
      .trim()
      .max(10)
      .refine(isCalendarDate, "Enter a valid date.")
      .refine(
        (value) => !value || value <= getMalaysiaToday(),
        "The consent date cannot be in the future."
      )
      .default(""),
  })
  .superRefine((profile, context) => {
    if (profile.countryRegion === "Other" && !profile.countryOther) {
      context.addIssue({
        code: "custom",
        path: ["countryOther"],
        message: "Enter the country or region.",
      })
    }

    if (profile.exportsInternationally === "Yes" && !profile.exportMarkets) {
      context.addIssue({
        code: "custom",
        path: ["exportMarkets"],
        message: "List the markets where the company currently exports.",
      })
    }

    if (profile.consent && !profile.consentName) {
      context.addIssue({
        code: "custom",
        path: ["consentName"],
        message: "Enter the consenting person's name.",
      })
    }

    if (profile.consent && !profile.consentDate) {
      context.addIssue({
        code: "custom",
        path: ["consentDate"],
        message: "Select the consent date.",
      })
    }
  })

export type CompanyProfileValidationErrors = Partial<
  Record<keyof CompanyRegistrationProfile, string>
>

export type CompanyProfileSectionId =
  | "company"
  | "contact"
  | "industry"
  | "profile"
  | "offer"
  | "looking-for"
  | "preferences"
  | "needs"
  | "export"
  | "meeting"
  | "documents"
  | "consent"

export type CompanyProfileSectionCompletion = Record<
  CompanyProfileSectionId,
  {
    completed: number
    total: number
  }
>

export function validateCompanyRegistrationProfile(
  profile: CompanyRegistrationProfile
) {
  const result = registrationProfileSchema.safeParse(profile)

  if (result.success) {
    return {} satisfies CompanyProfileValidationErrors
  }

  return result.error.issues.reduce<CompanyProfileValidationErrors>(
    (errors, issue) => {
      const field = issue.path[0]

      if (typeof field === "string" && !(field in errors)) {
        errors[field as keyof CompanyRegistrationProfile] = issue.message
      }

      return errors
    },
    {}
  )
}

export function getCompanyProfileSectionCompletion(
  profile: CompanyRegistrationProfile
): CompanyProfileSectionCompletion {
  const errors = validateCompanyRegistrationProfile(profile)
  const validText = (field: keyof CompanyRegistrationProfile, value: string) =>
    Boolean(value.trim()) && !errors[field]
  const validList = (
    field: keyof CompanyRegistrationProfile,
    values: string[],
    otherValue = ""
  ) => (values.length > 0 || Boolean(otherValue.trim())) && !errors[field]
  const summarize = (questions: boolean[]) => ({
    completed: questions.filter(Boolean).length,
    total: questions.length,
  })

  return {
    company: summarize([
      validText("companyNameEn", profile.companyNameEn),
      validText("countryRegion", profile.countryRegion) && !errors.countryOther,
      validText("yearEstablished", profile.yearEstablished),
      validText("registrationNumber", profile.registrationNumber),
      validText("website", profile.website),
      validText("address", profile.address),
      validText("employeeRange", profile.employeeRange),
    ]),
    contact: summarize([
      validText("contactName", profile.contactName),
      validText("contactPosition", profile.contactPosition),
      validText("contactEmail", profile.contactEmail),
      validText("mobileNumber", profile.mobileNumber),
      validList("preferredLanguages", profile.preferredLanguages),
    ]),
    industry: summarize([
      validList("industries", profile.industries, profile.industryOther),
    ]),
    profile: summarize([
      validText("introduction", profile.introduction),
      validText("productsServices", profile.productsServices),
    ]),
    offer: summarize([validList("offers", profile.offers, profile.offerOther)]),
    "looking-for": summarize([
      validList("lookingFor", profile.lookingFor, profile.lookingForOther),
    ]),
    preferences: summarize([
      validList(
        "preferredPartnerTypes",
        profile.preferredPartnerTypes,
        profile.preferredPartnerOther
      ),
      validList("expectedOutcomes", profile.expectedOutcomes),
    ]),
    needs: summarize([
      validText("idealPartner", profile.idealPartner),
      validText("opportunity", profile.opportunity),
    ]),
    export: summarize([
      validText("exportsInternationally", profile.exportsInternationally) &&
        !errors.exportMarkets,
    ]),
    meeting: summarize([
      validText("meetingFormat", profile.meetingFormat),
      validText("availableMeetingDates", profile.availableMeetingDates),
      validText("maxMeetings", profile.maxMeetings),
    ]),
    documents: summarize([
      validList("supportingDocuments", profile.supportingDocuments),
    ]),
    consent: summarize([
      profile.consent,
      validText("consentName", profile.consentName),
      validText("consentDate", profile.consentDate),
    ]),
  }
}

export function getCompanyProfileCompletion(
  profile: CompanyRegistrationProfile
) {
  const errors = validateCompanyRegistrationProfile(profile)
  const requiredValues: Array<
    [keyof CompanyRegistrationProfile, string | boolean]
  > = [
    ["countryRegion", profile.countryRegion],
    ["companyNameEn", profile.companyNameEn],
    ["yearEstablished", profile.yearEstablished],
    ["registrationNumber", profile.registrationNumber],
    ["website", profile.website],
    ["address", profile.address],
    ["employeeRange", profile.employeeRange],
    ["contactName", profile.contactName],
    ["contactPosition", profile.contactPosition],
    ["contactEmail", profile.contactEmail],
    ["mobileNumber", profile.mobileNumber],
    ["introduction", profile.introduction],
    ["productsServices", profile.productsServices],
    ["idealPartner", profile.idealPartner],
    ["opportunity", profile.opportunity],
    ["exportsInternationally", profile.exportsInternationally],
    ["meetingFormat", profile.meetingFormat],
    ["availableMeetingDates", profile.availableMeetingDates],
    ["maxMeetings", profile.maxMeetings],
    ["consentName", profile.consentName],
    ["consentDate", profile.consentDate],
  ]
  const requiredLists: Array<[keyof CompanyRegistrationProfile, string[]]> = [
    ["preferredLanguages", profile.preferredLanguages],
    ["industries", profile.industries],
    ["offers", profile.offers],
    ["lookingFor", profile.lookingFor],
    ["preferredPartnerTypes", profile.preferredPartnerTypes],
    ["expectedOutcomes", profile.expectedOutcomes],
  ]
  const validValues = requiredValues.filter(
    ([field, value]) =>
      !errors[field] &&
      (typeof value === "boolean" ? value : Boolean(value.trim()))
  ).length
  const validLists = requiredLists.filter(
    ([field, values]) => !errors[field] && values.length > 0
  ).length
  const completed = validValues + validLists + (profile.consent ? 1 : 0)
  const total = 28

  return {
    completed,
    total,
    percentage: Math.min(100, Math.round((completed / total) * 100)),
  }
}

import { z } from "zod"

export const tchinaAttendeeTypes = [
  "business_delegate",
  "general_visitor",
] as const

export const tchinaRegistrationStatuses = [
  "pending",
  "provisioning",
  "approved",
  "rejected",
] as const

export const tchinaAttendanceDates = [
  "2026-08-31",
  "2026-09-01",
  "2026-09-02",
  "2026-09-03",
  "2026-09-04",
] as const

export type EventAttendeeType = (typeof tchinaAttendeeTypes)[number]
export type EventRegistrationStatus =
  (typeof tchinaRegistrationStatuses)[number]
export type TChinaLocale = "en" | "zh"

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).default("")
const textList = z.array(z.string().trim().min(1).max(120)).min(1).max(12)

export const tchinaDelegateAnswersSchema = z
  .object({
    companyNameEn: z.string().trim().min(2).max(240),
    companyNameZh: optionalText(240),
    position: z.string().trim().min(2).max(160),
    website: z.union([z.literal(""), z.url().max(500)]).default(""),
    sectors: textList,
    productsServices: z.string().trim().min(2).max(3_000),
    offers: z.string().trim().min(2).max(3_000),
    needs: z.string().trim().min(2).max(3_000),
    desiredPartners: z.string().trim().min(2).max(3_000),
    desiredOutcomes: z.string().trim().min(2).max(3_000),
    businessMatchingInterest: z.boolean(),
  })
  .strict()

export const tchinaVisitorAnswersSchema = z
  .object({
    organization: optionalText(240),
    position: optionalText(160),
    industryInterests: textList,
    visitPurpose: z.string().trim().min(2).max(3_000),
  })
  .strict()

const sharedRegistrationFields = {
  locale: z.enum(["en", "zh"]),
  fullName: z.string().trim().min(2).max(160),
  email: z.email().trim().max(320),
  mobileNumber: z
    .string()
    .trim()
    .min(7)
    .max(32)
    .regex(/^\+[1-9][0-9 ()-]{6,30}$/, "Use an international number."),
  chatPlatform: z.enum(["none", "email", "whatsapp", "wechat"]),
  chatId: optionalText(320),
  countryRegion: z.string().trim().min(2).max(120),
  preferredLanguage: z.enum(["en", "zh"]),
  attendanceDates: z
    .array(z.enum(tchinaAttendanceDates))
    .min(1)
    .max(tchinaAttendanceDates.length),
  consent: z.literal(true),
  websiteConfirm: optionalText(240),
}

export const tchinaRegistrationRequestSchema = z.discriminatedUnion(
  "attendeeType",
  [
    z
      .object({
        ...sharedRegistrationFields,
        attendeeType: z.literal("business_delegate"),
        delegate: tchinaDelegateAnswersSchema,
      })
      .strict(),
    z
      .object({
        ...sharedRegistrationFields,
        attendeeType: z.literal("general_visitor"),
        visitor: tchinaVisitorAnswersSchema,
      })
      .strict(),
  ]
).superRefine((registration, context) => {
  if (
    registration.chatPlatform !== "email" &&
    registration.chatId.length > 120
  ) {
    context.addIssue({
      code: "custom",
      message: "Contact ID must be at most 120 characters.",
      path: ["chatId"],
    })
  }
})

export type TChinaRegistrationRequest = z.infer<
  typeof tchinaRegistrationRequestSchema
>
export type TChinaDelegateAnswers = z.infer<typeof tchinaDelegateAnswersSchema>
export type TChinaVisitorAnswers = z.infer<typeof tchinaVisitorAnswersSchema>

export type TChinaEvent = {
  id: string
  singleton_key: "plexus"
  title: string
  city: string
  venue_name: string
  venue_address: string
  organizer_name: string
  support_email: string
  starts_on: string
  ends_on: string
  timezone: string
  registration_open: boolean
}

export type TChinaRegistration = {
  id: string
  event_id: string
  reference_code: string
  attendee_type: EventAttendeeType
  normalized_email: string
  full_name: string
  mobile_number: string
  chat_platform: "none" | "email" | "whatsapp" | "wechat"
  chat_id: string
  country_region: string
  preferred_language: TChinaLocale
  attendance_dates: string[]
  answers: TChinaDelegateAnswers | TChinaVisitorAnswers
  status: EventRegistrationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  vendor_company_id: string | null
  auth_user_id: string | null
  receipt_email_sent_at: string | null
  invitation_email_sent_at: string | null
  setup_email_sent_at: string | null
  consented_at: string
  created_at: string
  updated_at: string
}

export const genericTChinaRegistrationSuccess = {
  ok: true,
  submitted: true,
} as const

export function normalizeTChinaEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeTChinaPhone(phone: string) {
  return `+${phone.replace(/\D/g, "")}`
}

export function isTChinaLocale(locale: string): locale is TChinaLocale {
  return locale === "en" || locale === "zh"
}

export function createTChinaReference(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "")
  return `TC26-${day}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
}

import { z } from "zod"

import { isPlaceholderIndustrySector } from "@/lib/industry-sectors"

const phonePattern = /^\+?[0-9][0-9().\s-]{5,29}$/

function isHttpUrl(value: string) {
  if (!value) return true

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
}

export const publicPartnerRegistrationSchema = z.object({
  tenantSlug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  companyName: z.string().trim().min(2).max(240),
  registrationNumber: z.string().trim().min(2).max(120),
  website: z
    .string()
    .trim()
    .max(240)
    .refine(
      isHttpUrl,
      "Enter a complete URL starting with http:// or https://."
    ),
  sector: z
    .string()
    .trim()
    .min(2, "Select an industry sector.")
    .max(120)
    .refine(
      (value) => !isPlaceholderIndustrySector(value),
      "Select an industry sector."
    ),
  introduction: z
    .string()
    .trim()
    .max(3000)
    .refine(
      (value) => countWords(value) >= 100 && countWords(value) <= 200,
      "Use 100 to 200 words."
    ),
  productsServices: z.string().trim().min(20).max(3000),
  lookingFor: z.string().trim().min(20).max(2000),
  contactName: z.string().trim().min(2).max(160),
  contactPosition: z.string().trim().min(2).max(160),
  contactEmail: z.email("Enter a valid email address.").trim(),
  mobileNumber: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => phonePattern.test(value),
      "Enter a valid phone number with an optional country code."
    ),
})

export type PublicPartnerRegistrationInput = z.infer<
  typeof publicPartnerRegistrationSchema
>

export type PublicPartnerRegistrationField =
  keyof PublicPartnerRegistrationInput

export type PublicPartnerRegistrationActionState = {
  ok: boolean
  message?: string
  errors?: Partial<Record<PublicPartnerRegistrationField | "logo", string>>
}

export const emptyPublicPartnerRegistrationState: PublicPartnerRegistrationActionState =
  { ok: false }

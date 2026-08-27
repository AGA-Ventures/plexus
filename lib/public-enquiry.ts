import { z } from "zod"

import { publicLocales, type PublicLocale } from "@/lib/public-site"

export const publicEnquiryTypes = [
  "pricing",
  "pilot",
  "onboarding",
  "other",
] as const

export type PublicEnquiryType = (typeof publicEnquiryTypes)[number]

export const publicEnquiryRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    organisation: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40).optional().default(""),
    enquiryType: z.enum(publicEnquiryTypes),
    message: z.string().trim().min(10).max(4000),
    locale: z.enum(publicLocales),
    sourcePage: z.enum(["pricing", "contact"]),
    websiteConfirm: z.string().max(200).optional().default(""),
  })
  .strict()

export type PublicEnquiry = z.infer<typeof publicEnquiryRequestSchema>

export type PublicEnquiryFieldErrors = Record<
  string,
  "invalid" | "invalidEmail"
>

export function getPublicEnquiryFieldErrors(
  error: z.ZodError
): PublicEnquiryFieldErrors {
  return error.issues.reduce<PublicEnquiryFieldErrors>((fieldErrors, issue) => {
    const field = issue.path.join(".") || "form"

    fieldErrors[field] ??= field === "email" ? "invalidEmail" : "invalid"
    return fieldErrors
  }, {})
}

export function normalizePublicEnquiryEmail(value: string) {
  return value.trim().toLowerCase()
}

export function isPublicLocale(value: string): value is PublicLocale {
  return publicLocales.includes(value as PublicLocale)
}

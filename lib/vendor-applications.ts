import { z } from "zod"

import {
  getCompanyProfileCoreErrors,
  registrationProfileSchema,
} from "@/lib/company-profile"
import type { VendorType } from "@/lib/auth"
import type { CompanyRegistrationProfile } from "@/lib/local-db"

export const vendorApplicationStatuses = [
  "pending",
  "provisioning",
  "approved",
  "rejected",
] as const

export type VendorApplicationStatus = (typeof vendorApplicationStatuses)[number]

export type VendorApplication = {
  id: string
  admin_id: string
  vendor_type: VendorType
  normalized_email: string
  contact_name: string
  company_name: string
  profile_data: CompanyRegistrationProfile
  profile_complete: number
  status: VendorApplicationStatus
  reviewed_by: string | null
  reviewed_at: string | null
  vendor_company_id: string | null
  auth_user_id: string | null
  setup_email_sent_at: string | null
  created_at: string
  updated_at: string
}

export const vendorApplicationProfileSchema =
  registrationProfileSchema.superRefine((profile, context) => {
    const errors = getCompanyProfileCoreErrors(profile, {
      includeMeetingArrangement: false,
    })

    for (const [field, message] of Object.entries(errors)) {
      context.addIssue({
        code: "custom",
        path: [field],
        message,
      })
    }
  })

export const vendorApplicationRequestSchema = z
  .object({
    tenantSlug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    vendorType: z.enum(["delegation", "partner"]),
    profile: vendorApplicationProfileSchema,
    websiteConfirm: z.string().max(240).optional(),
  })
  .strict()

export type VendorApplicationFieldErrors = Partial<
  Record<keyof CompanyRegistrationProfile | "form", string>
>

export function getVendorApplicationFieldErrors(error: z.ZodError) {
  return error.issues.reduce<VendorApplicationFieldErrors>((errors, issue) => {
    const field =
      issue.path[0] === "profile" && typeof issue.path[1] === "string"
        ? issue.path[1]
        : "form"

    if (!errors[field as keyof VendorApplicationFieldErrors]) {
      errors[field as keyof VendorApplicationFieldErrors] = issue.message
    }

    return errors
  }, {})
}

export function normalizeVendorApplicationEmail(email: string) {
  return email.trim().toLowerCase()
}

export const genericVendorApplicationSuccess = {
  ok: true,
  submitted: true,
} as const

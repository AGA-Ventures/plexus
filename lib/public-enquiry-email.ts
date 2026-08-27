import "server-only"

import { Resend } from "resend"

import {
  normalizePublicEnquiryEmail,
  type PublicEnquiry,
} from "@/lib/public-enquiry"

const fallbackContactEmail = "admin@ylinspiration.com"
const temporaryWhatsAppNumber = "+60 12-345 6789"

export function getPublicEnquiryChannels() {
  const contactEmail =
    process.env.PLEXUS_PUBLIC_CONTACT_EMAIL?.trim() || fallbackContactEmail
  const whatsappNumber =
    process.env.PLEXUS_PUBLIC_WHATSAPP_NUMBER?.trim() || temporaryWhatsAppNumber
  const whatsappDisplay =
    process.env.PLEXUS_PUBLIC_WHATSAPP_DISPLAY?.trim() ||
    temporaryWhatsAppNumber

  return { contactEmail, whatsappNumber, whatsappDisplay }
}

export function buildPublicWhatsAppHref(message: string) {
  const { whatsappNumber } = getPublicEnquiryChannels()
  const digits = whatsappNumber.replace(/\D/g, "")

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

function getResendFromAddress() {
  return (
    process.env.PLEXUS_EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    ""
  )
}

function formatEnquiryEmail(enquiry: PublicEnquiry) {
  return [
    "New Plexus public enquiry",
    "",
    `Name: ${enquiry.name}`,
    `Organisation: ${enquiry.organisation}`,
    `Email: ${normalizePublicEnquiryEmail(enquiry.email)}`,
    `Phone: ${enquiry.phone || "Not provided"}`,
    `Enquiry type: ${enquiry.enquiryType}`,
    `Locale: ${enquiry.locale}`,
    `Source page: ${enquiry.sourcePage}`,
    `Submitted at: ${new Date().toISOString()}`,
    "",
    "Message:",
    enquiry.message,
  ].join("\n")
}

export async function sendPublicEnquiryEmail(enquiry: PublicEnquiry) {
  const contactEmail = process.env.PLEXUS_PUBLIC_CONTACT_EMAIL?.trim()
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = getResendFromAddress()

  if (!contactEmail || !apiKey || !from) {
    return { ok: false as const, reason: "service_unavailable" as const }
  }

  try {
    const result = await new Resend(apiKey).emails.send({
      from,
      to: [contactEmail],
      replyTo: normalizePublicEnquiryEmail(enquiry.email),
      subject: `Plexus enquiry: ${enquiry.enquiryType}`,
      text: formatEnquiryEmail(enquiry),
    })

    if (result.error || !result.data?.id) {
      console.error("Public enquiry delivery was rejected by Resend.")
      return { ok: false as const, reason: "delivery_failed" as const }
    }

    return { ok: true as const }
  } catch {
    console.error("Public enquiry delivery failed.")
    return { ok: false as const, reason: "delivery_failed" as const }
  }
}

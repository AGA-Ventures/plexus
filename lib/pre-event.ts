import { countryCallingCodeOptions } from "@/lib/international-phone"
import type { PublicLocale } from "@/lib/public-site"

export type PreEventCountryOption = {
  countryCode: string
  countryName: string
}

type PreEventCoBrand = {
  name: string
  attribution: string
  logoSrc: string
  logoAlt: string
}

type PreEventRegionalChannel = {
  label: string
  href: string
}

type PreEventCampaignConfig = {
  whatsappNumber: string | null
  whatsappDisplay: string | null
  email: string | null
  coBrand: PreEventCoBrand | null
  regionalChannels: PreEventRegionalChannel[]
}

export const preEventCampaignConfig: PreEventCampaignConfig = {
  whatsappNumber: process.env.PLEXUS_PUBLIC_WHATSAPP_NUMBER?.trim() || null,
  whatsappDisplay: process.env.PLEXUS_PUBLIC_WHATSAPP_DISPLAY?.trim() || null,
  email: process.env.PLEXUS_PUBLIC_CONTACT_EMAIL?.trim() || null,
  coBrand: null,
  regionalChannels: [],
}

const localeTags: Record<PublicLocale, string> = {
  en: "en-MY",
  ms: "ms-MY",
  "zh-Hant": "zh-Hant",
}

export function getPreEventCountryOptions(
  locale: PublicLocale
): PreEventCountryOption[] {
  const localeTag = localeTags[locale]
  const displayNames = new Intl.DisplayNames([localeTag], { type: "region" })

  return countryCallingCodeOptions
    .map(({ countryCode }) => ({
      countryCode,
      countryName: displayNames.of(countryCode) ?? countryCode,
    }))
    .sort(
      (left, right) =>
        left.countryName.localeCompare(right.countryName, localeTag) ||
        left.countryCode.localeCompare(right.countryCode, "en")
    )
}

export function buildPreEventWhatsAppHref({
  countryName,
  messageTemplate,
  whatsappNumber = preEventCampaignConfig.whatsappNumber,
}: {
  countryName: string
  messageTemplate: string
  whatsappNumber?: string | null
}) {
  if (!whatsappNumber) {
    return null
  }

  const message = messageTemplate.replace("{country}", countryName.trim())
  const digits = whatsappNumber.replace(/\D/g, "")

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildPreEventEmailHref({
  email,
  subject,
  body,
}: {
  email: string
  subject: string
  body: string
}) {
  const params = new URLSearchParams({ subject, body })

  return `mailto:${email}?${params.toString()}`
}

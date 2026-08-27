import enContent from "@/messages/public/en.json"
import msContent from "@/messages/public/ms.json"
import zhHansContent from "@/messages/public/zh-Hans.json"

import type { PublicLocale } from "@/lib/public-site"

export type EventAudience =
  | "business"
  | "operators"
  | "investment"
  | "government"

export type EventFormat = "online" | "hybrid" | "onground"
export type EventStatus = "upcoming" | "past"
export type EventType = "delegation" | "forum" | "matchmaking" | "roadshow"

type EventSlug = keyof typeof enContent.events.items

function localizedCopy(slug: EventSlug) {
  return {
    en: enContent.events.items[slug],
    ms: msContent.events.items[slug],
    "zh-Hans": zhHansContent.events.items[slug],
  } satisfies Record<PublicLocale, (typeof enContent.events.items)[EventSlug]>
}

export const events = [
  {
    slug: "macau-malaysia-business-delegation",
    status: "upcoming",
    illustrative: true,
    image: "/events/macau-malaysia-business-delegation.webp",
    date: "2026-10-22",
    location: "Kuala Lumpur, Malaysia",
    format: "hybrid",
    audiences: ["business", "investment"],
    sectors: [
      "Food & Beverage",
      "Trade & Distribution",
      "Tourism",
      "Digital services",
    ],
    languages: ["EN", "简中", "BM"],
    interpreter: true,
    eventType: "delegation",
    relatedAudience: "investment",
    ...enContent.events.items["macau-malaysia-business-delegation"],
    localized: localizedCopy("macau-malaysia-business-delegation"),
  },
  {
    slug: "malayconnect-delegation-forum",
    status: "upcoming",
    illustrative: true,
    image: "/events/malayconnect-delegation-forum.webp",
    date: "2026-09-18",
    location: "Kuala Lumpur, Malaysia",
    format: "hybrid",
    audiences: ["operators", "investment", "government"],
    sectors: ["Manufacturing", "Green energy", "Logistics", "Fintech"],
    languages: ["EN", "简中", "BM"],
    interpreter: true,
    eventType: "forum",
    relatedAudience: "government",
    ...enContent.events.items["malayconnect-delegation-forum"],
    localized: localizedCopy("malayconnect-delegation-forum"),
  },
  {
    slug: "klang-region-business-night",
    status: "upcoming",
    illustrative: true,
    image: "/events/klang-region-business-night-v2.webp",
    date: "2026-11-06",
    location: "Klang, Selangor, Malaysia",
    format: "onground",
    audiences: ["business", "operators"],
    sectors: ["Cross-sector SME"],
    languages: ["EN", "BM", "简中"],
    interpreter: false,
    eventType: "matchmaking",
    relatedAudience: "business",
    ...enContent.events.items["klang-region-business-night"],
    localized: localizedCopy("klang-region-business-night"),
  },
  {
    slug: "greater-bay-malaysia-investment-roadshow",
    status: "upcoming",
    illustrative: true,
    image: "/events/greater-bay-malaysia-investment-roadshow.webp",
    date: "2026-12-03",
    location: "Macao SAR & Kuala Lumpur",
    format: "hybrid",
    audiences: ["investment", "government"],
    sectors: ["Advanced manufacturing", "Green energy", "Digital economy"],
    languages: ["EN", "简中", "BM"],
    interpreter: true,
    eventType: "roadshow",
    relatedAudience: "investment",
    ...enContent.events.items["greater-bay-malaysia-investment-roadshow"],
    localized: localizedCopy("greater-bay-malaysia-investment-roadshow"),
  },
] as const satisfies ReadonlyArray<{
  slug: EventSlug
  status: EventStatus
  illustrative: true
  image: `/events/${string}.webp`
  date: string
  location: string
  format: EventFormat
  audiences: readonly EventAudience[]
  sectors: readonly string[]
  languages: readonly string[]
  interpreter: boolean
  eventType: EventType
  relatedAudience: EventAudience
  title: string
  summary: string
  before: string
  onsite: string
  after: string
  localized: Record<PublicLocale, (typeof enContent.events.items)[EventSlug]>
}>

export function getLocalizedEvents(locale: PublicLocale) {
  return events.map(({ localized, ...event }) => ({
    ...event,
    status: event.status as EventStatus,
    ...localized[locale],
  }))
}

export function getLocalizedEvent(slug: string, locale: PublicLocale) {
  const seededEvent = events.find((event) => event.slug === slug)

  if (!seededEvent) {
    return null
  }

  const { localized, ...event } = seededEvent

  return {
    ...event,
    status: event.status as EventStatus,
    ...localized[locale],
  }
}

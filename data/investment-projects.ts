import enContent from "@/messages/public/en.json"
import msContent from "@/messages/public/ms.json"
import zhHansContent from "@/messages/public/zh-Hans.json"

import type { PublicLocale } from "@/lib/public-site"

type InvestmentProjectSlug = keyof typeof enContent.investmentProjects.items

function localizedCopy(slug: InvestmentProjectSlug) {
  return {
    en: enContent.investmentProjects.items[slug],
    ms: msContent.investmentProjects.items[slug],
    "zh-Hans": zhHansContent.investmentProjects.items[slug],
  } satisfies Record<
    PublicLocale,
    (typeof enContent.investmentProjects.items)[InvestmentProjectSlug]
  >
}

export const investmentProjects = [
  {
    slug: "selangor-agri-food-park",
    illustrative: true,
    ...enContent.investmentProjects.items["selangor-agri-food-park"],
    localized: localizedCopy("selangor-agri-food-park"),
  },
  {
    slug: "green-energy-corridor",
    illustrative: true,
    ...enContent.investmentProjects.items["green-energy-corridor"],
    localized: localizedCopy("green-energy-corridor"),
  },
  {
    slug: "digital-economy-zone",
    illustrative: true,
    ...enContent.investmentProjects.items["digital-economy-zone"],
    localized: localizedCopy("digital-economy-zone"),
  },
] as const satisfies ReadonlyArray<{
  slug: InvestmentProjectSlug
  illustrative: true
  title: string
  location: string
  sector: string
  stage: string
  incentiveContext: string
  summary: string
  localized: Record<
    PublicLocale,
    (typeof enContent.investmentProjects.items)[InvestmentProjectSlug]
  >
}>

export function getLocalizedInvestmentProjects(locale: PublicLocale) {
  return investmentProjects.map(({ localized, ...project }) => ({
    ...project,
    ...localized[locale],
  }))
}

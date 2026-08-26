import { existsSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { events, getLocalizedEvent } from "@/data/events"
import {
  getLocalizedInvestmentProjects,
  investmentProjects,
} from "@/data/investment-projects"
import {
  getPublicContent,
  publicLocales,
  type PublicLocale,
} from "@/lib/public-site"

const audienceLabels: Record<
  PublicLocale,
  Record<"business" | "operators" | "investment" | "government", string>
> = {
  en: {
    business: "Business owners",
    operators: "Program operators",
    investment: "Investment promotion",
    government: "Government & bilateral",
  },
  ms: {
    business: "Pemilik perniagaan",
    operators: "Pengendali program",
    investment: "Promosi pelaburan",
    government: "Kerajaan & dua hala",
  },
  "zh-Hant": {
    business: "企業與業主",
    operators: "運營方與商會",
    investment: "招商機構",
    government: "政府與雙邊",
  },
}

describe("public content and route seeds", () => {
  it("keeps every event illustrative, uniquely routed, and localized", () => {
    expect(events).toHaveLength(4)
    expect(new Set(events.map((event) => event.slug)).size).toBe(events.length)
    expect(events.every((event) => event.illustrative)).toBe(true)
    expect(new Set(events.map((event) => event.image)).size).toBe(events.length)
    expect(
      events.every(
        (event) =>
          event.image.startsWith("/events/") &&
          event.image.endsWith(".webp") &&
          existsSync(join(process.cwd(), "public", event.image.slice(1)))
      )
    ).toBe(true)

    for (const locale of publicLocales) {
      for (const seededEvent of events) {
        const event = getLocalizedEvent(seededEvent.slug, locale)
        expect(event?.title).toBeTruthy()
        expect(event?.summary).toBeTruthy()
        expect(event?.before).toBeTruthy()
        expect(event?.onsite).toBeTruthy()
        expect(event?.after).toBeTruthy()
      }
    }
  })

  it("keeps all investment examples illustrative in every locale", () => {
    expect(investmentProjects).toHaveLength(3)
    expect(investmentProjects.every((project) => project.illustrative)).toBe(
      true
    )

    for (const locale of publicLocales) {
      const projects = getLocalizedInvestmentProjects(locale)
      expect(projects).toHaveLength(3)
      expect(
        projects.every((project) => project.title && project.summary)
      ).toBe(true)
    }
  })

  it("uses the canonical audience labels and footer destinations", () => {
    const expectedRoutes = [
      "/for-businesses",
      "/for-program-operators",
      "/for-investment",
      "/for-government",
      "/events",
    ]

    for (const locale of publicLocales) {
      const content = getPublicContent(locale)
      expect(content.audiences).toEqual(audienceLabels[locale])
      expect(content.footer.platformLinks.map((link) => link.href)).toEqual(
        expectedRoutes
      )
    }
  })
})

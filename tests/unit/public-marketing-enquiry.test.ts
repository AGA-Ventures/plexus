import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/components/site-footer", () => ({
  SiteFooter: () => null,
}))
vi.mock("@/components/site-header", () => ({
  SiteHeader: () => null,
}))
vi.mock("@/lib/public-enquiry-email", () => ({
  buildPublicWhatsAppHref: () => "https://wa.me/60123456789?text=hello",
  getPublicEnquiryChannels: () => ({
    contactEmail: "admin@ylinspiration.com",
    whatsappDisplay: "+60 12-345 6789",
  }),
}))

import { PublicMarketingPage } from "@/components/public-page"

async function renderPage(slug: "pricing" | "contact", searchParams = {}) {
  return renderToStaticMarkup(
    await PublicMarketingPage({
      slug,
      searchParams: Promise.resolve(searchParams),
    })
  )
}

describe("public pricing and contact enquiries", () => {
  it("renders the localized pricing form with pricing preselected", async () => {
    const markup = await renderPage("pricing", { lang: "ms" })

    expect(markup).toContain('href="#enquiry"')
    expect(markup).toContain("Minta cadangan mengikut skop")
    expect(markup).toContain('name="enquiryType"')
    expect(markup).toMatch(/<option value="pricing" selected="">/)
    expect(markup).not.toContain('href="mailto:admin@ylinspiration.com"')
    expect(markup).toContain("Buat pertanyaan melalui WhatsApp")
    expect(markup).toContain('href="https://wa.me/60123456789?text=hello"')
  })

  it("renders the Contact form with pricing preselected from its query", async () => {
    const markup = await renderPage("contact", {
      lang: "zh-Hant",
      topic: "pricing",
    })

    expect(markup).toContain('href="#enquiry"')
    expect(markup).toMatch(/<option value="pricing" selected="">/)
    expect(markup).toContain('name="message"')
  })
})

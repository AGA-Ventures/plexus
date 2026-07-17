import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Agreement01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  getPublicContent,
  normalizePublicLocale,
  type PublicLegalSlug,
  type PublicPageSlug,
  withLocale,
} from "@/lib/public-site"

type SearchParams = Promise<{ lang?: string }>

export async function PublicMarketingPage({
  slug,
  searchParams,
}: {
  slug: PublicPageSlug
  searchParams: SearchParams
}) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const page = content.pages[slug]
  const currentPath = `/${slug}`

  return (
    <main className="min-h-svh bg-[#071326] text-[#f7f9ff]">
      <SiteHeader content={content} locale={locale} currentPath={currentPath} />
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-28">
        <div>
          <p className="mb-5 text-xs font-semibold tracking-[0.28em] text-[#d4af37] uppercase">
            {content.meta.tagline}
          </p>
          <h1 className="text-4xl leading-tight font-semibold text-white sm:text-6xl">
            {page.title}
          </h1>
          <p className="mt-6 text-base leading-7 text-[#c7ceda] sm:text-lg">
            {page.body}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-[#0a84ff] px-5 text-sm text-white hover:bg-[#25d0ff] hover:text-[#071326]"
            >
              <Link href={withLocale("/contact", locale)}>
                {content.nav.contact}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-[#c7ceda]/28 bg-white/6 px-5 text-sm text-white hover:bg-white/12 hover:text-white"
            >
              <Link href={withLocale("/how-it-works", locale)}>
                {content.nav.howItWorks}
              </Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          {page.points.map((point, index) => (
            <div
              key={point}
              className="rounded-md border border-[#c7ceda]/14 bg-[#08172c] p-6"
            >
              <span className="grid size-11 place-items-center rounded-md border border-[#25d0ff]/24 bg-[#25d0ff]/10 text-[#25d0ff]">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  size={22}
                  strokeWidth={1.8}
                />
              </span>
              <p className="mt-5 text-sm leading-6 text-[#c7ceda]">{point}</p>
              <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-[#d4af37] uppercase">
                0{index + 1}
              </p>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter content={content} locale={locale} currentPath={currentPath} />
    </main>
  )
}

export async function PublicLegalPage({
  slug,
  searchParams,
}: {
  slug: PublicLegalSlug
  searchParams: SearchParams
}) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const page = content.legal[slug]
  const currentPath = `/legal/${slug}`

  return (
    <main className="min-h-svh bg-[#071326] text-[#f7f9ff]">
      <SiteHeader content={content} locale={locale} currentPath={currentPath} />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <span className="grid size-12 place-items-center rounded-md border border-[#d4af37]/28 bg-[#d4af37]/10 text-[#d4af37]">
          <HugeiconsIcon icon={Agreement01Icon} size={24} strokeWidth={1.8} />
        </span>
        <h1 className="mt-8 text-4xl font-semibold text-white sm:text-6xl">
          {page.title}
        </h1>
        <p className="mt-6 text-base leading-7 text-[#c7ceda] sm:text-lg">
          {page.body}
        </p>
        <div className="mt-10 rounded-md border border-[#c7ceda]/14 bg-[#08172c] p-6">
          <p className="text-sm leading-7 text-[#c7ceda]/78">
            {content.legal.staticNotice}
          </p>
        </div>
        <Link
          href={withLocale("/", locale)}
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#25d0ff] transition hover:text-white"
        >
          {content.nav.home}
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
        </Link>
      </section>
      <SiteFooter content={content} locale={locale} currentPath={currentPath} />
    </main>
  )
}

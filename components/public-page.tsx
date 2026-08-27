import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Agreement01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { PublicEnquiryForm } from "@/components/public-enquiry-form"
import { Button } from "@/components/ui/button"
import {
  buildPublicWhatsAppHref,
  getPublicEnquiryChannels,
} from "@/lib/public-enquiry-email"
import {
  getPublicContent,
  normalizePublicLocale,
  type PublicLegalSlug,
  type PublicLocale,
  type PublicPageSlug,
  withLocale,
} from "@/lib/public-site"

type SearchParams = Promise<{ lang?: string; topic?: string }>

type ClosingCopy = {
  title?: string
  body: string
  cta?: string
  href?: string
}

const pageCopy: Record<
  PublicLocale,
  { status: string; next: string; back: string; principle: string }
> = {
  en: {
    status: "Pre-launch application",
    next: "Discuss your program",
    back: "Back to Plexus",
    principle: "Human-reviewed by design",
  },
  ms: {
    status: "Aplikasi pra-pelancaran",
    next: "Bincangkan program anda",
    back: "Kembali ke Plexus",
    principle: "Direka untuk semakan manusia",
  },
  "zh-Hant": {
    status: "預先發佈應用程式",
    next: "討論您的計劃",
    back: "返回 Plexus",
    principle: "以人工審核為設計核心",
  },
}

export async function PublicMarketingPage({
  slug,
  searchParams,
  currentPath: currentPathOverride,
}: {
  slug: PublicPageSlug
  searchParams: SearchParams
  currentPath?: string
}) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const page = content.pages[slug]
  const labels = pageCopy[locale]
  const currentPath = currentPathOverride ?? `/${slug}`
  const hasEnquiryForm = slug === "contact" || slug === "pricing"
  const enquirySource = slug === "pricing" ? "pricing" : "contact"
  const enquiryType =
    slug === "pricing" || params.topic === "pricing" ? "pricing" : "other"
  const enquiryChannels = getPublicEnquiryChannels()
  const whatsappHref = buildPublicWhatsAppHref(content.enquiry.whatsappMessage)
  const enquiryTitle =
    slug === "pricing" ? content.enquiry.pricingTitle : content.enquiry.title
  const enquiryBody =
    slug === "pricing" ? content.enquiry.pricingBody : content.enquiry.body
  const principle =
    slug === "pricing" ? content.pages.pricing.principle : labels.principle
  const principleBody =
    slug === "pricing"
      ? content.pages.pricing.principleBody
      : content.problem.body
  const isNarrativePage = slug === "about"
  const nextHref =
    slug === "contact"
      ? "#enquiry"
      : slug === "pricing"
        ? "#enquiry"
        : "/contact"
  const contactPage = slug === "contact" ? content.pages.contact : null
  const feature = "feature" in page ? page.feature : null
  const sectionTitle =
    "sectionTitle" in page ? page.sectionTitle : content.how.title
  const sectionBody = "sectionBody" in page ? page.sectionBody : null
  const closing: ClosingCopy | null =
    "closing" in page ? (page.closing as ClosingCopy) : null

  return (
    <main className="min-h-svh bg-[#f7f7f2] text-[#111826]">
      <SiteHeader content={content} locale={locale} currentPath={currentPath} />

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.375rem] bg-[#0758c8] text-white">
          <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
            <div className="p-7 sm:p-12 lg:p-16">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#071326] px-3 py-1.5 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-[#80e8ff]" />
                {labels.status}
              </div>
              <h1 className="mt-8 max-w-4xl text-[clamp(3rem,6vw,5.75rem)] leading-[0.94] font-semibold tracking-[-0.035em] text-balance whitespace-pre-line">
                {page.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#e4f3ff] sm:text-lg">
                {page.body}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-lg bg-[#071326] px-5 text-white hover:bg-[#102443]"
                >
                  <Link
                    href={
                      nextHref.startsWith("#")
                        ? nextHref
                        : withLocale(nextHref, locale)
                    }
                  >
                    {slug === "contact"
                      ? content.enquiry.formCta
                      : slug === "pricing"
                        ? content.pages.pricing.closing.cta
                        : labels.next}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-lg border-white/35 !bg-white px-5 !text-[#0758c8] hover:!bg-[#eaf7ff]"
                >
                  <Link href={withLocale("/how-it-works", locale)}>
                    {content.nav.howItWorks}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-[#071326] p-7 sm:p-10 lg:p-12">
              <HugeiconsIcon
                icon={Globe02Icon}
                size={42}
                strokeWidth={1.5}
                className="text-[#80e8ff]"
              />
              <div className="mt-16">
                <p className="text-3xl leading-tight font-semibold tracking-[-0.025em]">
                  {principle}
                </p>
                <p className="mt-4 max-w-md text-sm leading-6 text-[#b8cadc]">
                  {principleBody}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <div>
              <h2 className="text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-5xl">
                {sectionTitle}
              </h2>
              {sectionBody ? (
                <p className="mt-6 max-w-md text-base leading-7 text-[#53667c]">
                  {sectionBody}
                </p>
              ) : null}
            </div>
            <div className="border-t border-[#b9cddd]">
              {page.points.map((point) => {
                const pointKey = typeof point === "string" ? point : point.title

                return (
                  <article
                    key={pointKey}
                    className={`grid gap-5 border-b border-[#b9cddd] py-7 ${isNarrativePage ? "" : "sm:grid-cols-[auto_1fr] sm:items-start"}`}
                  >
                    {!isNarrativePage ? (
                      <span className="grid size-10 place-items-center rounded-full bg-[#dcecf7] text-[#0758c8]">
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={20}
                          strokeWidth={1.8}
                        />
                      </span>
                    ) : null}
                    {typeof point === "string" ? (
                      <p className="max-w-2xl text-lg leading-8 text-[#3f5369]">
                        {point}
                      </p>
                    ) : (
                      <div className="max-w-2xl">
                        <h3
                          className={`${isNarrativePage ? "text-2xl" : "text-xl"} leading-tight font-semibold tracking-[-0.02em] text-[#111826]`}
                        >
                          {point.title}
                        </h3>
                        <p className="mt-3 text-base leading-7 text-[#3f5369] sm:text-lg sm:leading-8">
                          {point.body}
                        </p>
                      </div>
                    )}
                  </article>
                )
              })}
              {closing ? (
                <div className="border-b border-[#b9cddd] py-7">
                  {closing.title ? (
                    <h3 className="text-xl leading-tight font-semibold tracking-[-0.02em] text-[#111826]">
                      {closing.title}
                    </h3>
                  ) : null}
                  <p
                    className={`max-w-2xl text-lg leading-8 text-[#3f5369] ${closing.title ? "mt-3" : ""}`}
                  >
                    {closing.body}
                  </p>
                  {closing.cta && closing.href ? (
                    <Link
                      href={
                        closing.href.startsWith("#")
                          ? closing.href
                          : withLocale(closing.href, locale)
                      }
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0758c8] hover:text-[#071326]"
                    >
                      {closing.cta}
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={16}
                        strokeWidth={1.8}
                      />
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {feature ? (
                <article className="border-b border-[#b9cddd] py-7">
                  <h3 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 max-w-2xl text-lg leading-8 text-[#3f5369]">
                    {feature.body}
                  </p>
                  <Link
                    href={withLocale(feature.href, locale)}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#0758c8] hover:text-[#071326]"
                  >
                    {feature.cta}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      strokeWidth={1.8}
                    />
                  </Link>
                </article>
              ) : null}
            </div>
          </div>

          {slug !== "contact" ? (
            <Link
              href={withLocale("/", locale)}
              className="mt-12 inline-flex items-center gap-2 text-sm font-semibold text-[#0758c8] hover:text-[#071326]"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={16}
                strokeWidth={1.8}
              />
              {labels.back}
            </Link>
          ) : null}
        </div>
      </section>

      {hasEnquiryForm ? (
        <section
          id="enquiry"
          className="border-y border-[#b9cddd] bg-[#eef4f8] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <h2
                id={`${enquirySource}-enquiry-heading`}
                className="max-w-lg text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-5xl"
              >
                {enquiryTitle}
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#53667c]">
                {enquiryBody}
              </p>
            </div>
            <div className="space-y-8">
              <PublicEnquiryForm
                copy={content.enquiry.form}
                locale={locale}
                sourcePage={enquirySource}
                initialEnquiryType={enquiryType}
                fallbackEmail={enquiryChannels.contactEmail}
              />
              <div className="border-t border-[#b9cddd] pt-7">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#111826]">
                  {content.enquiry.whatsappTitle}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#53667c]">
                  {content.enquiry.whatsappBody}
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-[11px] bg-[#075e54] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#064b43] focus-visible:ring-2 focus-visible:ring-[#075e54] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <HugeiconsIcon
                    icon={WhatsappIcon}
                    size={20}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  {content.enquiry.whatsappCta}
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {contactPage ? (
        <section
          id="faq"
          className="border-y border-[#b9cddd] bg-[#dcecf7] px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
        >
          <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <h2 className="max-w-lg text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-5xl">
                {contactPage.faqTitle}
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#53667c]">
                {contactPage.faqBody}
              </p>
              <Link
                href={withLocale("/", locale)}
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0758c8] transition-colors hover:text-[#071326] focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                {labels.back}
              </Link>
            </div>

            <div className="border-t border-[#9dbbd2]">
              {contactPage.faq.map((item, index) => (
                <details
                  key={item.question}
                  open={index === 0}
                  className="group border-b border-[#9dbbd2]"
                >
                  <summary className="grid min-h-20 cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-6 py-5 text-lg leading-7 font-semibold text-[#111826] transition-colors hover:text-[#0758c8] focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <span className="grid size-9 place-items-center rounded-full bg-[#071326] text-white transition-colors group-open:bg-[#0758c8]">
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={17}
                        strokeWidth={1.9}
                        aria-hidden="true"
                        className="transition-transform duration-200 group-open:rotate-180"
                      />
                    </span>
                  </summary>
                  <p className="max-w-2xl pr-12 pb-7 text-sm leading-7 text-[#3f5369] sm:text-base">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
  const labels = pageCopy[locale]
  const currentPath = `/legal/${slug}`

  return (
    <main className="min-h-svh bg-[#f7f7f2] text-[#111826]">
      <SiteHeader content={content} locale={locale} currentPath={currentPath} />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <span className="grid size-12 place-items-center rounded-xl bg-[#071326] text-[#80e8ff]">
          <HugeiconsIcon icon={Agreement01Icon} size={24} strokeWidth={1.8} />
        </span>
        <h1 className="mt-8 text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
          {page.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-[#53667c]">{page.body}</p>
        <div className="mt-10 rounded-2xl bg-[#dcecf7] p-7">
          <p className="text-sm leading-7 text-[#3f5369]">
            {content.legal.staticNotice}
          </p>
        </div>
        <Link
          href={withLocale("/", locale)}
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0758c8] hover:text-[#071326]"
        >
          {labels.back}
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
        </Link>
      </section>
      <SiteFooter content={content} locale={locale} currentPath={currentPath} />
    </main>
  )
}

import Image from "next/image"
import type { Metadata } from "next"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Airplane01Icon,
  ArrowUpRight01Icon,
  BubbleChatTranslateIcon,
  CalendarCheckIcon,
  Car01Icon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  Hotel01Icon,
  InformationCircleIcon,
  Location01Icon,
  Passport01Icon,
  UserGroupIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"

import { PreEventCountryExplorer } from "@/components/pre-event-country-explorer"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import {
  buildPreEventEmailHref,
  buildPreEventWhatsAppHref,
  getPreEventCountryOptions,
  preEventCampaignConfig,
} from "@/lib/pre-event"
import {
  getPublicContent,
  normalizePublicLocale,
  withLocale,
} from "@/lib/public-site"

type PageProps = {
  searchParams: Promise<{ lang?: string }>
}

const serviceIcons = [
  Airplane01Icon,
  Hotel01Icon,
  Passport01Icon,
  Car01Icon,
  BubbleChatTranslateIcon,
  UserGroupIcon,
  Location01Icon,
  CalendarCheckIcon,
]

const openGraphLocales = {
  en: "en_MY",
  ms: "ms_MY",
  "zh-Hant": "zh_Hant",
} as const

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const page = content.preEvent

  return {
    title: page.meta.title,
    description: page.meta.description,
    alternates: {
      canonical: withLocale("/pre-event", locale),
      languages: {
        en: withLocale("/pre-event", "en"),
        ms: withLocale("/pre-event", "ms"),
        "zh-Hant": withLocale("/pre-event", "zh-Hant"),
      },
    },
    openGraph: {
      type: "website",
      title: page.meta.title,
      description: page.meta.description,
      locale: openGraphLocales[locale],
      url: withLocale("/pre-event", locale),
      images: [
        {
          url: "/plexus-pre-event-planning.webp",
          width: 1672,
          height: 941,
          alt: page.meta.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.meta.title,
      description: page.meta.description,
      images: ["/plexus-pre-event-planning.webp"],
    },
  }
}

export default async function PreEventPage({ searchParams }: PageProps) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const page = content.preEvent
  const countries = getPreEventCountryOptions(locale)
  const genericWhatsappHref = buildPreEventWhatsAppHref({
    countryName: page.countries.countryFallback,
    messageTemplate: page.countries.messageTemplate,
  })
  const emailHref = preEventCampaignConfig.email
    ? buildPreEventEmailHref({
        email: preEventCampaignConfig.email,
        subject: page.contact.emailSubject,
        body: page.contact.emailBody,
      })
    : null
  const callbackHref = preEventCampaignConfig.email
    ? buildPreEventEmailHref({
        email: preEventCampaignConfig.email,
        subject: page.contact.callbackSubject,
        body: page.contact.callbackBody,
      })
    : null
  const primaryContactHref =
    genericWhatsappHref ?? emailHref ?? withLocale("/contact", locale)
  const contactIsExternal = Boolean(genericWhatsappHref)
  const configuredContactLabel = genericWhatsappHref
    ? page.hero.primaryCta
    : locale === "ms"
      ? "Bincangkan program anda"
      : locale === "zh-Hant"
        ? "討論您的計劃"
        : "Discuss your program"
  const campaignLabel =
    locale === "ms"
      ? "Perkhidmatan khas pra-acara"
      : locale === "zh-Hant"
        ? "特別活動前服務"
        : "Special pre-event service"

  return (
    <main className="min-h-svh bg-[#f7f7f2] text-[#111826]">
      <section className="bg-[#071326] text-white">
        <SiteHeader
          content={content}
          locale={locale}
          currentPath="/pre-event"
        />

        <div className="hero-reveal mx-auto max-w-7xl px-4 pt-14 pb-8 text-center sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#80e8ff]/35 bg-[#80e8ff]/10 px-3 py-1.5 text-xs font-semibold text-[#80e8ff]">
            <span className="size-1.5 rounded-full bg-[#80e8ff]" />
            {campaignLabel} · {page.hero.eyebrow}
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl leading-[1.08] font-semibold tracking-[-0.035em] text-white sm:text-6xl lg:text-7xl">
            {page.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/72 sm:text-lg">
            {page.hero.body}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={primaryContactHref}
              target={contactIsExternal ? "_blank" : undefined}
              rel={contactIsExternal ? "noreferrer" : undefined}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0758c8] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#064caf] focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071326] focus-visible:outline-none sm:w-auto"
            >
              <HugeiconsIcon
                icon={genericWhatsappHref ? WhatsappIcon : Globe02Icon}
                size={19}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              {configuredContactLabel}
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </a>
            <a
              href="#country-support"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[4px] px-5 py-3 text-sm font-semibold text-[#80e8ff] underline decoration-[#80e8ff]/45 underline-offset-8 transition hover:text-white focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none sm:w-auto"
            >
              {page.hero.secondaryCta}
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </a>
          </div>

          {preEventCampaignConfig.coBrand ? (
            <div
              className="mx-auto mt-8 flex max-w-md items-center justify-center gap-4 border-t border-white/15 pt-5"
              data-testid="pre-event-cobrand"
            >
              <Image
                src={preEventCampaignConfig.coBrand.logoSrc}
                alt={preEventCampaignConfig.coBrand.logoAlt}
                width={180}
                height={80}
                className="h-10 w-auto object-contain"
              />
              <p className="text-left text-xs leading-5 text-white/70">
                {preEventCampaignConfig.coBrand.attribution}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-9 sm:px-6 lg:px-8 lg:pb-12">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.375rem] border border-white/12 bg-[#030b18] shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
            <Image
              src="/plexus-pre-event-planning.webp"
              alt={page.meta.imageAlt}
              fill
              priority
              sizes="(min-width: 1280px) 1216px, calc(100vw - 2rem)"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-[#d5e1eb] bg-[#f7f7f2] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#0758c8] uppercase">
              {page.journey.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.025em] text-[#111826] sm:text-4xl">
              {page.journey.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#53667c]">
              {page.journey.body}
            </p>
          </div>

          <div className="mt-12 grid border-y border-[#d5e1eb] sm:grid-cols-2 lg:grid-cols-4">
            {page.journey.steps.map((step, index) => (
              <article
                key={step.title}
                className="border-b border-[#d5e1eb] px-0 py-7 sm:px-6 lg:border-r lg:border-b-0 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0 sm:[&:nth-child(odd)]:border-r"
              >
                <p className="text-3xl font-medium tracking-[-0.03em] text-[#0a84ff]">
                  0{index + 1}
                </p>
                <h3 className="mt-4 text-base font-semibold text-[#111826]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#53667c]">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#0758c8] uppercase">
              {page.services.eyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-[-0.025em] text-[#111826] sm:text-4xl">
              {page.services.title}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#53667c]">
              {page.services.body}
            </p>

            <div className="mt-10 grid border-y border-[#d5e1eb] sm:grid-cols-2">
              {page.services.items.map((service, index) => {
                const Icon = serviceIcons[index] ?? CheckmarkCircle02Icon

                return (
                  <article
                    key={service.title}
                    className="flex gap-4 border-b border-[#d5e1eb] py-5 sm:px-5 sm:[&:nth-child(even)]:pr-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(odd)]:pl-0"
                  >
                    <HugeiconsIcon
                      icon={Icon}
                      size={22}
                      strokeWidth={1.7}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[#0758c8]"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-[#111826]">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#53667c]">
                        {service.body}
                      </p>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="mt-6 flex gap-3 rounded-[4px] bg-[#eef4f8] p-5 text-[#405872]">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={21}
                strokeWidth={1.8}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[#0758c8]"
              />
              <p className="text-sm leading-6">{page.services.disclaimer}</p>
            </div>
          </div>

          <aside className="border-t border-[#d5e1eb] pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
            <div className="flex items-start gap-4">
              <HugeiconsIcon
                icon={Globe02Icon}
                size={26}
                strokeWidth={1.7}
                aria-hidden="true"
                className="mt-1 shrink-0 text-[#0758c8]"
              />
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-[#0758c8] uppercase">
                  {page.markets.eyebrow}
                </p>
                <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.025em] text-[#111826]">
                  {page.markets.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-[#53667c]">
                  {page.markets.body}
                </p>
              </div>
            </div>

            <div className="mt-8 grid border-y border-[#d5e1eb]">
              {page.markets.badges.map((badge, index) => {
                const Icon = index < 2 ? CheckmarkCircle02Icon : Globe02Icon

                return (
                  <div
                    key={badge}
                    className="flex min-h-14 items-center justify-between border-b border-[#d5e1eb] py-3 text-sm font-semibold last:border-b-0"
                  >
                    <span>{badge}</span>
                    <HugeiconsIcon
                      icon={Icon}
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                      className={
                        index < 2 ? "text-[#0758c8]" : "text-[#6a7a8e]"
                      }
                    />
                  </div>
                )
              })}
            </div>

            <div className="mt-8 border-l-2 border-[#0a84ff] pl-5">
              <p className="text-sm leading-6 text-[#53667c]">
                {page.countries.points[2]}
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section
        id="country-support"
        className="scroll-mt-4 border-y border-[#d5e1eb] bg-[#eef4f8] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#0758c8] uppercase">
              {page.countries.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.025em] text-[#111826] sm:text-4xl">
              {page.countries.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#53667c]">
              {page.countries.body}
            </p>
            <div className="mt-8 border-y border-[#d5e1eb]">
              {page.countries.points.map((point) => (
                <div
                  key={point}
                  className="flex gap-3 border-b border-[#d5e1eb] py-4 last:border-b-0"
                >
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={20}
                    strokeWidth={1.8}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[#0758c8]"
                  />
                  <p className="text-sm leading-6 text-[#53667c]">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <PreEventCountryExplorer
            countries={countries}
            copy={page.countries}
            whatsappNumber={preEventCampaignConfig.whatsappNumber}
            whatsappDisplay={preEventCampaignConfig.whatsappDisplay}
          />
        </div>
      </section>

      <section
        id="contact"
        className="scroll-mt-4 bg-[#071326] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-8 border-y border-white/16 py-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#80e8ff] uppercase">
              {page.contact.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-white sm:text-4xl">
              {page.contact.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">
              {page.contact.body}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={primaryContactHref}
              target={contactIsExternal ? "_blank" : undefined}
              rel={contactIsExternal ? "noreferrer" : undefined}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-[#0758c8] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#064caf] focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none"
            >
              <HugeiconsIcon
                icon={genericWhatsappHref ? WhatsappIcon : Globe02Icon}
                size={19}
                strokeWidth={1.9}
                aria-hidden="true"
              />
              {genericWhatsappHref
                ? page.contact.whatsappCta
                : configuredContactLabel}
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </a>
            {emailHref ? (
              <a
                href={emailHref}
                data-testid="pre-event-email"
                className="inline-flex min-h-12 items-center justify-center rounded-[4px] border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none"
              >
                {page.contact.emailCta}
              </a>
            ) : null}
            {callbackHref ? (
              <a
                href={callbackHref}
                data-testid="pre-event-callback"
                className="inline-flex min-h-12 items-center justify-center rounded-[4px] border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none"
              >
                {page.contact.callbackCta}
              </a>
            ) : null}
            {preEventCampaignConfig.regionalChannels.map((channel) => (
              <a
                key={channel.href}
                href={channel.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-[4px] border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none"
              >
                {channel.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter content={content} locale={locale} currentPath="/pre-event" />
    </main>
  )
}

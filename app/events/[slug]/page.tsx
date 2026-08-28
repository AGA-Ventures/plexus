import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { events, getLocalizedEvent, type EventAudience } from "@/data/events"
import {
  getPublicContent,
  normalizePublicLocale,
  type PublicLocale,
  withLocale,
} from "@/lib/public-site"

const dateLocales: Record<PublicLocale, string> = {
  en: "en-MY",
  ms: "ms-MY",
  "zh-Hans": "zh-Hans-MO",
}

const audienceRoutes: Record<EventAudience, string> = {
  business: "/for-businesses",
  operators: "/for-program-operators",
  investment: "/for-investment",
  government: "/for-government",
}

function formatEventDate(date: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(dateLocales[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }))
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ lang?: string }>
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const locale = normalizePublicLocale(query.lang)
  const content = getPublicContent(locale)
  const event = getLocalizedEvent(slug, locale)

  if (!event) {
    notFound()
  }

  const detail = content.events.detail
  const relatedHref = audienceRoutes[event.relatedAudience]

  return (
    <main className="min-h-svh bg-[#f7f7f2] text-[#111826]">
      <SiteHeader
        content={content}
        locale={locale}
        currentPath={`/events/${event.slug}`}
      />

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.375rem] bg-[#0758c8] text-white">
          <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
            <div className="p-7 sm:p-12 lg:p-16">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#071326] px-3 py-1.5 text-xs font-semibold">
                  {content.events.labels.illustrative}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0758c8]">
                  {content.events.labels.status[event.status]}
                </span>
                <span className="rounded-full bg-[#dcecf7] px-3 py-1.5 text-xs font-semibold text-[#0758c8]">
                  {content.events.labels.format[event.format]}
                </span>
              </div>
              <h1 className="mt-8 max-w-4xl text-[clamp(3rem,6vw,5.75rem)] leading-[0.94] font-semibold tracking-[-0.035em] text-balance">
                {event.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#e4f3ff] sm:text-lg">
                {formatEventDate(event.date, locale)} · {event.location}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {event.audiences.map((audience) => (
                  <span
                    key={audience}
                    className="rounded-full bg-[#071326] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {content.audiences[audience]}
                  </span>
                ))}
              </div>
              <div className="mt-9">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-lg bg-[#071326] px-5 text-white hover:bg-[#102443]"
                >
                  <Link
                    href={withLocale(
                      `/contact?event=${encodeURIComponent(event.slug)}`,
                      locale
                    )}
                  >
                    {detail.expressInterest}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-col justify-between bg-[#071326] p-7 sm:p-10 lg:p-12">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={42}
                strokeWidth={1.5}
                className="text-[#80e8ff]"
              />
              <div className="mt-16">
                <p className="text-3xl leading-tight font-semibold tracking-[-0.025em]">
                  {content.trust.principle}
                </p>
                <p className="mt-4 max-w-md text-sm leading-6 text-[#b8cadc]">
                  {content.events.index.trustLine}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <h2 className="text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-5xl">
            {detail.overview}
          </h2>
          <p className="text-lg leading-8 text-[#3f5369]">{event.summary}</p>
        </div>
      </section>

      <section className="bg-[#eef4f8] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
            {detail.whoShouldJoin}
          </h2>
          <div className="mt-10 border-t border-[#b9cddd]">
            {event.audiences.map((audience) => (
              <article
                key={audience}
                className="grid gap-5 border-b border-[#b9cddd] py-7 sm:grid-cols-[auto_1fr] sm:items-start"
              >
                <span className="grid size-10 place-items-center rounded-full bg-[#dcecf7] text-[#0758c8]">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={20}
                    strokeWidth={1.8}
                  />
                </span>
                <div>
                  <h3 className="text-xl font-semibold">
                    {content.audiences[audience]}
                  </h3>
                  <p className="mt-2 text-base leading-7 text-[#3f5369]">
                    {detail.audienceDescriptions[audience]}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
            {detail.flow}
          </h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-[#b9cddd] lg:grid-cols-3">
            {[
              { title: detail.before, body: event.before },
              { title: detail.onsite, body: event.onsite },
              { title: detail.after, body: event.after },
            ].map((phase, index) => (
              <li key={phase.title} className="bg-[#dcecf7] p-7 sm:p-8">
                <span className="grid size-10 place-items-center rounded-full bg-[#071326] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-8 text-2xl font-semibold tracking-[-0.02em]">
                  {phase.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#3f5369]">
                  {phase.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#071326] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
            {detail.atGlance}
          </h2>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/12 lg:grid-cols-3">
            <div className="bg-[#102443] p-7 sm:p-8">
              <dt className="text-sm font-semibold text-[#80e8ff]">
                {detail.sectors}
              </dt>
              <dd className="mt-4 text-base leading-7 text-[#dcecf7]">
                {event.sectors.join(" · ")}
              </dd>
            </div>
            <div className="bg-[#102443] p-7 sm:p-8">
              <dt className="text-sm font-semibold text-[#80e8ff]">
                {detail.expectedFormat}
              </dt>
              <dd className="mt-4 text-base leading-7 text-[#dcecf7]">
                {detail.eventTypes[event.eventType]}
              </dd>
            </div>
            <div className="bg-[#102443] p-7 sm:p-8">
              <dt className="text-sm font-semibold text-[#80e8ff]">
                {detail.languages}
              </dt>
              <dd className="mt-4 text-base leading-7 text-[#dcecf7]">
                {event.languages.join(" · ")} —{" "}
                {event.interpreter ? detail.interpreter : detail.noInterpreter}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="bg-[#dcecf7] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0758c8]">
              {detail.relatedAudience}
            </p>
            <Link
              href={withLocale(relatedHref, locale)}
              className="mt-3 inline-flex items-center gap-2 text-2xl font-semibold text-[#111826] hover:text-[#0758c8]"
            >
              {content.audiences[event.relatedAudience]}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                strokeWidth={1.8}
              />
            </Link>
          </div>
          <Link
            href={withLocale("/events", locale)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0758c8] hover:text-[#071326]"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.8} />
            {detail.allEvents}
          </Link>
        </div>
      </section>

      <section className="bg-[#071326] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <h2 className="text-3xl leading-tight font-semibold tracking-[-0.025em]">
            {content.trust.principle}
          </h2>
          <p className="text-base leading-7 text-[#dcecf7]">
            {content.events.index.trustLine}
          </p>
        </div>
      </section>

      <SiteFooter
        content={content}
        locale={locale}
        currentPath={`/events/${event.slug}`}
      />
    </main>
  )
}

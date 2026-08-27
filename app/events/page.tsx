import Link from "next/link"
import Image from "next/image"
import { ArrowRight01Icon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getLocalizedEvents, type EventStatus } from "@/data/events"
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

function formatEventDate(date: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(dateLocales[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const page = content.events.index
  const seededEvents = getLocalizedEvents(locale)
  const groupedEvents: Array<{
    status: EventStatus
    title: string
    items: typeof seededEvents
  }> = [
    {
      status: "upcoming",
      title: page.upcoming,
      items: seededEvents.filter((event) => event.status === "upcoming"),
    },
    {
      status: "past",
      title: page.past,
      items: seededEvents.filter((event) => event.status === "past"),
    },
  ]

  return (
    <main className="min-h-svh bg-[#f7f7f2] text-[#111826]">
      <SiteHeader content={content} locale={locale} currentPath="/events" />

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.375rem] bg-[#0758c8] text-white">
          <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
            <div className="p-7 sm:p-12 lg:p-16">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#071326] px-3 py-1.5 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-[#80e8ff]" />
                {page.eyebrow}
              </div>
              <h1 className="mt-8 max-w-4xl text-[clamp(3rem,6vw,5.75rem)] leading-[0.94] font-semibold tracking-[-0.035em] text-balance whitespace-pre-line">
                {page.title}
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-[#e4f3ff] sm:text-lg">
                {page.body}
              </p>
              <div className="mt-9">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-lg bg-[#071326] px-5 text-white hover:bg-[#102443]"
                >
                  <Link href={withLocale("/contact", locale)}>
                    {page.primaryCta}
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
                  {content.problem.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <h2 className="text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
            {page.programsTitle}
          </h2>
          <div className="mt-12 grid gap-14">
            {groupedEvents.map((group) => (
              <section key={group.status}>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">
                  {group.title}
                </h3>
                {group.items.length > 0 ? (
                  <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-[#b9cddd] lg:grid-cols-2">
                    {group.items.map((event) => (
                      <article
                        key={event.slug}
                        className="group flex min-h-full flex-col overflow-hidden bg-[#eef4f8]"
                      >
                        <Link
                          href={withLocale(`/events/${event.slug}`, locale)}
                          aria-label={`${page.viewEvent}: ${event.title}`}
                          className="relative block aspect-[16/9] overflow-hidden bg-[#071326] outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-[#80e8ff] focus-visible:ring-inset"
                        >
                          <Image
                            src={event.image}
                            alt=""
                            fill
                            sizes="(min-width: 1180px) 590px, (min-width: 1024px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025] motion-reduce:transition-none"
                          />
                        </Link>

                        <div className="flex flex-1 flex-col p-7 sm:p-8">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-[#071326] px-3 py-1.5 text-xs font-semibold text-white">
                              {content.events.labels.illustrative}
                            </span>
                            <span className="rounded-full bg-[#dcecf7] px-3 py-1.5 text-xs font-semibold text-[#0758c8]">
                              {content.events.labels.status[event.status]}
                            </span>
                            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0758c8]">
                              {content.events.labels.format[event.format]}
                            </span>
                          </div>
                          <h4 className="mt-7 text-2xl leading-tight font-semibold tracking-[-0.02em]">
                            {event.title}
                          </h4>
                          <p className="mt-4 text-sm leading-6 text-[#53667c]">
                            {formatEventDate(event.date, locale)} ·{" "}
                            {event.location}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {event.audiences.map((audience) => (
                              <span
                                key={audience}
                                className="rounded-full bg-[#dcecf7] px-3 py-1 text-xs font-semibold text-[#3f5369]"
                              >
                                {content.audiences[audience]}
                              </span>
                            ))}
                          </div>
                          <p className="mt-5 text-base leading-7 text-[#3f5369]">
                            {event.summary}
                          </p>
                          <Link
                            href={withLocale(`/events/${event.slug}`, locale)}
                            className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-[#0758c8] outline-none hover:text-[#071326] focus-visible:text-[#071326] focus-visible:underline focus-visible:underline-offset-4"
                          >
                            {page.viewEvent}
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              size={16}
                              strokeWidth={1.8}
                            />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-base leading-7 text-[#53667c]">
                    {page.noPast}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef4f8] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-sm font-semibold text-[#0758c8]">
            {page.howEyebrow}
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
            {page.howTitle}
          </h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-[#b9cddd] lg:grid-cols-3">
            {page.phases.map((phase, index) => (
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

      <section className="bg-[#071326] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-3xl text-3xl leading-tight font-semibold tracking-[-0.025em]">
            {page.ctaTitle}
          </h2>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-lg bg-[#0758c8] px-5 text-white hover:bg-[#064caf]"
          >
            <Link href={withLocale("/contact", locale)}>{page.ctaAction}</Link>
          </Button>
        </div>
      </section>

      <section className="bg-[#dcecf7] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <h2 className="text-3xl leading-tight font-semibold tracking-[-0.025em]">
            {content.trust.principle}
          </h2>
          <p className="text-base leading-7 text-[#3f5369]">{page.trustLine}</p>
        </div>
      </section>

      <SiteFooter content={content} locale={locale} currentPath="/events" />
    </main>
  )
}

import Image from "next/image"
import Link from "next/link"
import type React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiBrain01Icon,
  Building01Icon,
  ChartRelationshipIcon,
  CheckmarkCircle02Icon,
  Globe02Icon,
  LicenseDraftIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  getPublicContent,
  normalizePublicLocale,
  withLocale,
} from "@/lib/public-site"

const stepIcons = [LicenseDraftIcon, AiBrain01Icon, ChartRelationshipIcon]
const portalIcons = [Globe02Icon, Building01Icon, UserGroupIcon]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)

  return (
    <main className="min-h-svh bg-[#071326] text-[#f7f9ff]">
      <section className="relative isolate overflow-hidden bg-[#071326]">
        <Image
          src="/plexus-event-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-30 object-cover object-center opacity-28 saturate-125"
        />
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_74%_14%,rgba(37,208,255,0.24),rgba(7,19,38,0)_34%),linear-gradient(90deg,rgba(7,19,38,0.98)_0%,rgba(7,19,38,0.88)_45%,rgba(7,19,38,0.64)_74%,rgba(7,19,38,0.92)_100%)]" />
        <SiteHeader content={content} locale={locale} currentPath="/" />

        <div className="mx-auto grid min-h-[720px] w-full max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="mb-6 text-xs font-semibold tracking-[0.28em] text-[#d4af37] uppercase">
              {content.hero.eyebrow}
            </p>
            <h1 className="max-w-4xl text-5xl leading-[0.94] font-semibold tracking-normal text-white sm:text-7xl">
              {content.hero.title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#c7ceda] sm:text-lg">
              {content.hero.body}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 bg-[#0a84ff] px-5 text-sm text-white shadow-[0_0_32px_rgba(10,132,255,0.34)] hover:bg-[#25d0ff] hover:text-[#071326]"
              >
                <Link href={withLocale("/for-vendors", locale)}>
                  {content.hero.vendorCta}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-[#c7ceda]/28 bg-white/6 px-5 text-sm text-white hover:bg-white/12 hover:text-white"
              >
                <Link href={withLocale("/for-businesses", locale)}>
                  {content.hero.businessCta}
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-[#c7ceda]/14 bg-[#030b18]/82 p-5 shadow-2xl shadow-black/35 backdrop-blur">
            <Image
              src="/plexus-brand-wordmark.png"
              alt="Plexus - Sharper Connections."
              width={720}
              height={215}
              priority
              className="h-auto w-full object-contain"
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {content.how.steps.map((step, index) => {
                const Icon = stepIcons[index]
                return (
                  <div
                    key={step.title}
                    className="rounded-md border border-[#c7ceda]/12 bg-white/5 p-4"
                  >
                    <HugeiconsIcon
                      icon={Icon}
                      size={22}
                      strokeWidth={1.8}
                      className="text-[#25d0ff]"
                    />
                    <p className="mt-3 text-sm font-semibold text-white">
                      {step.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#c7ceda]/12 bg-[#030b18] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#d4af37] uppercase">
              Problem / Solution
            </p>
            <h2 className="text-3xl leading-tight font-semibold text-white sm:text-4xl">
              {content.problem.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#c7ceda]">
              {content.problem.body}
            </p>
          </div>
          <div className="grid gap-3">
            {content.problem.points.map((point) => (
              <FeatureRow key={point}>{point}</FeatureRow>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <SectionIntro title={content.how.title} body={content.how.body} />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {content.how.steps.map((step, index) => {
            const Icon = stepIcons[index]
            return (
              <DarkCard key={step.title}>
                <span className="grid size-12 place-items-center rounded-md border border-[#25d0ff]/24 bg-[#25d0ff]/10 text-[#25d0ff]">
                  <HugeiconsIcon icon={Icon} size={24} strokeWidth={1.8} />
                </span>
                <p className="mt-5 text-sm font-medium text-[#d4af37]">
                  0{index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#c7ceda]/74">
                  {step.body}
                </p>
              </DarkCard>
            )
          })}
        </div>
      </section>

      <section className="border-y border-[#c7ceda]/12 bg-[#030b18] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            title={content.portals.title}
            body={content.portals.body}
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {content.portals.items.map((item, index) => {
              const Icon = portalIcons[index]
              return (
                <DarkCard key={item.title}>
                  <span className="grid size-12 place-items-center rounded-md border border-[#d4af37]/28 bg-[#d4af37]/10 text-[#d4af37]">
                    <HugeiconsIcon icon={Icon} size={24} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#c7ceda]/74">
                    {item.body}
                  </p>
                </DarkCard>
              )
            })}
          </div>
        </div>
      </section>

      <section
        id="countries"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"
      >
        <div>
          <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#d4af37] uppercase">
            Countries Live
          </p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            {content.countries.title}
          </h2>
          <p className="mt-4 text-base leading-7 text-[#c7ceda]">
            {content.countries.body}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {content.countries.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-md border border-[#25d0ff]/24 bg-[#25d0ff]/10 px-4 py-3 text-sm font-medium text-[#25d0ff]"
            >
              {badge}
            </span>
          ))}
        </div>
      </section>

      <section className="border-y border-[#c7ceda]/12 bg-[#030b18] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#d4af37] uppercase">
              {content.proof.title}
            </p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">
              {content.proof.empty}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#c7ceda]">
              {content.proof.body}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Partner logo", "Testimonial", "Case study"].map((item) => (
              <div
                key={item}
                className="grid min-h-32 place-items-center rounded-md border border-dashed border-[#c7ceda]/18 bg-white/4 text-xs font-medium tracking-[0.18em] text-[#c7ceda]/50 uppercase"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-md border border-[#25d0ff]/20 bg-[#030b18] p-6 shadow-[0_0_48px_rgba(10,132,255,0.12)] sm:flex-row sm:items-center sm:justify-between lg:p-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {content.cta.title}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c7ceda]/76">
              {content.cta.body}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-[#0a84ff] px-5 text-sm text-white hover:bg-[#25d0ff] hover:text-[#071326]"
            >
              <Link href={withLocale("/for-vendors", locale)}>
                {content.cta.vendor}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 bg-[#d4af37] px-5 text-sm text-[#071326] hover:bg-[#f2d06b]"
            >
              <Link href={withLocale("/for-businesses", locale)}>
                {content.cta.business}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter content={content} locale={locale} currentPath="/" />
    </main>
  )
}

function SectionIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-[#c7ceda]">{body}</p>
    </div>
  )
}

function DarkCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[#c7ceda]/14 bg-[#08172c] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      {children}
    </div>
  )
}

function FeatureRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-4 rounded-md border border-[#c7ceda]/14 bg-[#08172c] p-5">
      <HugeiconsIcon
        icon={CheckmarkCircle02Icon}
        size={22}
        strokeWidth={1.8}
        className="mt-0.5 shrink-0 text-[#25d0ff]"
      />
      <p className="text-sm leading-6 text-[#c7ceda]">{children}</p>
    </div>
  )
}

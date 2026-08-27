import Link from "next/link"
import { CheckmarkCircle02Icon, Globe02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { getLocalizedInvestmentProjects } from "@/data/investment-projects"
import {
  getPublicContent,
  normalizePublicLocale,
  withLocale,
} from "@/lib/public-site"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  const locale = normalizePublicLocale(params.lang)
  const content = getPublicContent(locale)
  const page = content.investmentPage
  const projects = getLocalizedInvestmentProjects(locale)

  return (
    <main className="min-h-svh bg-[#f7f7f2] text-[#111826]">
      <SiteHeader
        content={content}
        locale={locale}
        currentPath="/for-investment"
      />

      <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[1.375rem] bg-[#0758c8] text-white">
          <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
            <div className="p-7 sm:p-12 lg:p-16">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#071326] px-3 py-1.5 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-[#80e8ff]" />
                {page.eyebrow}
              </div>
              <h1 className="mt-8 max-w-4xl whitespace-pre-line text-[clamp(3rem,5vw,4.75rem)] leading-[0.94] font-semibold tracking-[-0.035em] text-balance">
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
                  <Link href={withLocale("/contact", locale)}>
                    {page.primaryCta}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-lg border-white/35 !bg-white px-5 !text-[#0758c8] hover:!bg-[#eaf7ff]"
                >
                  <Link href={withLocale("/app", locale)}>
                    {page.secondaryCta}
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
          <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr]">
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-5xl">
              {content.audiences.investment}
            </h2>
            <div className="border-t border-[#b9cddd]">
              {page.sections.map((section) => (
                <article
                  key={section.title}
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
                    <h3 className="text-2xl leading-tight font-semibold tracking-[-0.02em]">
                      {section.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-lg leading-8 text-[#3f5369]">
                      {section.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071326] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-sm font-semibold text-[#80e8ff]">
            {page.projectsEyebrow}
          </p>
          <h2 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold tracking-[-0.03em] sm:text-6xl">
            {page.projectsTitle}
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-white/12 lg:grid-cols-3">
            {projects.map((project) => (
              <article key={project.slug} className="bg-[#102443] p-7 sm:p-8">
                <span className="inline-flex rounded-full bg-[#dcecf7] px-3 py-1.5 text-xs font-semibold text-[#0758c8]">
                  {content.investmentProjects.labels.illustrative}
                </span>
                <h3 className="mt-8 text-2xl font-semibold">{project.title}</h3>
                <p className="mt-4 text-sm leading-6 text-[#d3e2ef]">
                  {project.summary}
                </p>
                <dl className="mt-7 grid gap-4 border-t border-white/12 pt-6 text-sm">
                  <div>
                    <dt className="font-semibold text-[#80e8ff]">
                      {content.investmentProjects.labels.location}
                    </dt>
                    <dd className="mt-1 text-[#dcecf7]">{project.location}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#80e8ff]">
                      {content.investmentProjects.labels.sector}
                    </dt>
                    <dd className="mt-1 text-[#dcecf7]">{project.sector}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#80e8ff]">
                      {content.investmentProjects.labels.stage}
                    </dt>
                    <dd className="mt-1 text-[#dcecf7]">{project.stage}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[#80e8ff]">
                      {content.investmentProjects.labels.incentiveContext}
                    </dt>
                    <dd className="mt-1 text-[#dcecf7]">
                      {project.incentiveContext}
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
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

      <SiteFooter
        content={content}
        locale={locale}
        currentPath="/for-investment"
      />
    </main>
  )
}

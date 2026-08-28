import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUpRight01Icon,
  Globe02Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  normalizePublicLocale,
  type PublicContent,
  type PublicLocale,
  withLocale,
} from "@/lib/public-site"

export type SiteHeaderLocaleOption = {
  label: string
  shortLabel: string
  value: string
  href: string
}

type SiteHeaderProps = {
  content: PublicContent
  locale: string
  currentPath?: string
  supportedLocales?: PublicLocale[]
  localeOptions?: SiteHeaderLocaleOption[]
  homeHref?: string
  loginHref?: string
}

const headerCopy: Record<
  PublicLocale,
  { preview: string; preEvent: string; menu: string; language: string }
> = {
  en: {
    preview: "Product preview",
    preEvent: "Pre-event service",
    menu: "Menu",
    language: "Choose language",
  },
  ms: {
    preview: "Pratonton produk",
    preEvent: "Perkhidmatan pra-acara",
    menu: "Menu",
    language: "Pilih bahasa",
  },
  "zh-Hans": {
    preview: "产品预览",
    preEvent: "活动前服务",
    menu: "菜单",
    language: "选择语言",
  },
}

export function SiteHeader({
  content,
  locale,
  currentPath = "/",
  supportedLocales = ["en", "ms", "zh-Hans"],
  localeOptions,
  homeHref,
  loginHref,
}: SiteHeaderProps) {
  const publicLocale = normalizePublicLocale(locale)
  const labels = headerCopy[publicLocale]
  const navItems = [
    { label: content.nav.howItWorks, href: "/how-it-works" },
    { label: content.nav.product, href: "/app" },
    { label: content.nav.events, href: "/events" },
    { label: content.nav.pricing, href: "/pricing" },
  ]
  const audienceItems = [
    { label: content.audiences.business, href: "/for-businesses" },
    { label: content.audiences.operators, href: "/for-program-operators" },
    { label: content.audiences.investment, href: "/for-investment" },
    { label: content.audiences.government, href: "/for-government" },
  ]
  const locales =
    localeOptions ??
    [
      { label: "English", shortLabel: "EN", value: "en" as const },
      {
        label: "Bahasa Malaysia",
        shortLabel: "BM",
        value: "ms" as const,
      },
      {
        label: "简体中文",
        shortLabel: "简中",
        value: "zh-Hans" as const,
      },
    ]
      .filter((item) => supportedLocales.includes(item.value))
      .map((item) => ({
        ...item,
        href: withLocale(currentPath, item.value),
      }))
  const activeLocale =
    locales.find((item) => item.value === locale) ?? locales[0]
  const preEventActive = currentPath === "/pre-event"
  const audienceActive = audienceItems.some((item) => currentPath === item.href)
  const resolvedHomeHref = homeHref ?? withLocale("/", publicLocale)
  const resolvedLoginHref = loginHref ?? withLocale("/login", publicLocale)

  return (
    <header
      data-testid="site-header"
      className="relative z-40 border-b border-white/12 bg-[#071326] text-white"
    >
      <div className="mx-auto flex min-h-[4.25rem] w-full max-w-[1240px] items-center gap-3 px-4 sm:px-6 xl:px-5">
        <Link
          href={resolvedHomeHref}
          className="flex min-h-11 shrink-0 items-center rounded-md focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none"
          aria-label={content.meta.siteName}
        >
          <Image
            src="/plexus-wordmark-transparent-trimmed.png"
            alt="Plexus"
            width={1933}
            height={311}
            priority
            className="h-auto w-36 object-contain sm:w-[9.75rem]"
          />
        </Link>

        <nav className="ml-auto hidden min-w-0 items-center gap-0.5 text-[0.8125rem] xl:flex">
          {navItems.map((item) => {
            const active =
              currentPath === item.href ||
              (item.href === "/events" && currentPath.startsWith("/events/"))
            return (
              <Link
                key={item.href}
                href={withLocale(item.href, publicLocale)}
                aria-current={active ? "page" : undefined}
                className={[
                  "shrink-0 rounded-lg px-2.5 py-2.5 font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none",
                  active
                    ? "bg-white text-[#071326]"
                    : "text-[#dcecf7] hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            )
          })}
          <details className="group relative">
            <summary
              className={[
                "flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 py-2.5 font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none [&::-webkit-details-marker]:hidden",
                audienceActive
                  ? "bg-white text-[#071326]"
                  : "text-[#dcecf7] hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {content.nav.audiences}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
                className="transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="absolute right-0 z-50 mt-2 grid min-w-56 gap-1 rounded-lg bg-white p-2 text-[#071326] shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
              {audienceItems.map((item) => (
                <Link
                  key={item.href}
                  href={withLocale(item.href, publicLocale)}
                  aria-current={currentPath === item.href ? "page" : undefined}
                  className={[
                    "flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none",
                    currentPath === item.href
                      ? "bg-[#dcecf7] text-[#0758c8]"
                      : "text-[#405872] hover:bg-[#eef4f8] hover:text-[#111826]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-2">
          <Link
            href={withLocale("/pre-event", publicLocale)}
            aria-current={preEventActive ? "page" : undefined}
            className={[
              "hidden min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none xl:inline-flex",
              preEventActive
                ? "border-white/25 bg-white/10 text-white"
                : "border-[#80e8ff]/20 bg-[#80e8ff]/[0.04] text-[#80e8ff] hover:border-[#80e8ff]/35 hover:bg-[#80e8ff]/10 hover:text-white",
            ].join(" ")}
          >
            {labels.preEvent}
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              size={14}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Link>

          <details className="group relative">
            <summary
              role="button"
              aria-label={labels.language}
              className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-white/14 bg-white/[0.03] px-2.5 text-xs font-semibold text-white transition-colors hover:border-white/25 hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none [&::-webkit-details-marker]:hidden"
            >
              <HugeiconsIcon
                icon={Globe02Icon}
                size={15}
                strokeWidth={1.8}
                aria-hidden="true"
                className="hidden text-[#80e8ff] sm:block"
              />
              <span>{activeLocale.shortLabel}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
                className="text-white/60 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="absolute right-0 z-50 mt-2 grid min-w-48 gap-1 rounded-lg bg-white p-2 text-[#071326] shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
              {locales.map((item) => (
                <Link
                  key={item.value}
                  href={item.href}
                  aria-current={locale === item.value ? "true" : undefined}
                  className={[
                    "flex min-h-11 items-center justify-between gap-4 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none",
                    locale === item.value
                      ? "bg-[#dcecf7] text-[#0758c8]"
                      : "text-[#405872] hover:bg-[#eef4f8] hover:text-[#111826]",
                  ].join(" ")}
                >
                  <span>{item.label}</span>
                  <span className="text-[0.65rem] font-semibold tracking-[0.12em] text-[#6a7a8e]">
                    {item.shortLabel}
                  </span>
                </Link>
              ))}
            </div>
          </details>

          <Button
            asChild
            size="sm"
            className="hidden h-10 rounded-lg bg-[#0758c8] px-4 text-white hover:bg-[#064caf] sm:inline-flex"
          >
            <Link href={resolvedLoginHref}>{content.nav.login}</Link>
          </Button>

          <details className="group relative xl:hidden">
            <summary
              role="button"
              className="grid size-11 cursor-pointer list-none place-items-center rounded-lg border border-white/16 bg-white/[0.06] text-white transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-[#80e8ff] focus-visible:outline-none [&::-webkit-details-marker]:hidden"
            >
              <span className="sr-only">{labels.menu}</span>
              <HugeiconsIcon
                icon={Menu01Icon}
                size={20}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </summary>
            <div className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-xl bg-[#f7f7f2] p-3 text-[#111826] shadow-[0_20px_55px_rgba(0,0,0,0.28)]">
              <nav className="grid gap-1">
                {navItems.map((item) => {
                  const active =
                    currentPath === item.href ||
                    (item.href === "/events" &&
                      currentPath.startsWith("/events/"))
                  return (
                    <Link
                      key={item.href}
                      href={withLocale(item.href, publicLocale)}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "flex min-h-12 items-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none",
                        active
                          ? "bg-[#071326] text-white"
                          : "hover:bg-[#dcecf7]",
                      ].join(" ")}
                    >
                      {item.label}
                    </Link>
                  )
                })}
                <p className="px-4 pt-3 pb-1 text-xs font-semibold text-[#53667c]">
                  {content.nav.audiences}
                </p>
                {audienceItems.map((item) => (
                  <Link
                    key={item.href}
                    href={withLocale(item.href, publicLocale)}
                    aria-current={
                      currentPath === item.href ? "page" : undefined
                    }
                    className={[
                      "flex min-h-12 items-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none",
                      currentPath === item.href
                        ? "bg-[#071326] text-white"
                        : "hover:bg-[#dcecf7]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={withLocale("/pre-event", publicLocale)}
                  aria-current={preEventActive ? "page" : undefined}
                  className={[
                    "flex min-h-12 items-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none",
                    preEventActive
                      ? "bg-[#071326] text-white"
                      : "bg-[#dcecf7] text-[#0758c8] hover:bg-[#cfe5f5]",
                  ].join(" ")}
                >
                  {labels.preEvent}
                </Link>
              </nav>
              <div className="mt-3 border-t border-[#cbd9e5] pt-3 sm:hidden">
                <Link
                  href={resolvedLoginHref}
                  className="flex min-h-11 items-center justify-center rounded-lg bg-[#0758c8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#064caf] focus-visible:ring-2 focus-visible:ring-[#0a84ff] focus-visible:outline-none"
                >
                  {content.nav.login}
                </Link>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}

import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  type PublicContent,
  type PublicLocale,
  withLocale,
} from "@/lib/public-site"

type SiteHeaderProps = {
  content: PublicContent
  locale: PublicLocale
  currentPath?: string
}

export function SiteHeader({
  content,
  locale,
  currentPath = "/",
}: SiteHeaderProps) {
  const navItems = [
    { label: content.nav.howItWorks, href: "/how-it-works" },
    { label: content.nav.forVendors, href: "/for-vendors" },
    { label: content.nav.forBusinesses, href: "/for-businesses" },
    { label: content.nav.pricing, href: "/pricing" },
  ]

  return (
    <header className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4 rounded-md border border-[#c7ceda]/16 bg-[#071326]/86 px-3 py-3 shadow-2xl shadow-black/35 backdrop-blur-xl sm:px-4">
        <Link
          href={withLocale("/", locale)}
          className="flex min-w-0 items-center gap-3"
          aria-label={content.meta.siteName}
        >
          <Image
            src="/plexus-brand-mark.png"
            alt=""
            width={245}
            height={145}
            className="size-10 rounded-md border border-[#0a84ff]/35 bg-[#071326] object-cover p-1.5 shadow-[0_0_26px_rgba(37,208,255,0.18)]"
          />
          <span className="min-w-0 leading-tight">
            <Image
              src="/plexus-brand-wordmark.png"
              alt="Plexus"
              width={720}
              height={215}
              className="h-5 w-32 object-contain object-left sm:h-6 sm:w-40"
            />
            <span className="hidden max-w-72 truncate text-[0.68rem] tracking-[0.16em] text-[#c7ceda]/70 uppercase sm:block">
              {content.meta.tagline}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center rounded-md border border-[#c7ceda]/12 bg-white/5 p-1 text-sm text-[#c7ceda] lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={withLocale(item.href, locale)}
              className="rounded px-3 py-2 transition hover:bg-[#0a84ff]/16 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center rounded-md border border-[#c7ceda]/12 bg-white/5 p-1 sm:flex">
            {[
              { label: "EN", locale: "en" as const },
              { label: "BM", locale: "ms" as const },
              { label: "繁體中文", locale: "zh-Hant" as const },
            ].map((item) => (
              <Link
                key={item.locale}
                href={withLocale(currentPath, item.locale)}
                className={[
                  "rounded px-2.5 py-1.5 text-xs font-medium transition",
                  locale === item.locale
                    ? "bg-white text-[#071326]"
                    : "text-[#c7ceda] hover:bg-[#0a84ff]/16 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Button
            asChild
            size="sm"
            className="h-9 bg-[#0a84ff] px-4 text-white shadow-[0_0_26px_rgba(10,132,255,0.32)] hover:bg-[#25d0ff] hover:text-[#071326]"
          >
            <Link href={withLocale("/login", locale)}>{content.nav.login}</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

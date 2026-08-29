import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  Facebook01Icon,
  Linkedin01Icon,
} from "@hugeicons/core-free-icons"

import {
  getTenantBranding,
  publicLocales,
  type PublicContent,
  type PublicLocale,
  withLocale,
} from "@/lib/public-site"

type SiteFooterProps = {
  content: PublicContent
  locale: PublicLocale
  currentPath?: string
}

const publicLocaleLabels: Record<PublicLocale, string> = {
  en: "English",
  ms: "Bahasa Malaysia",
  "zh-Hans": "简体中文",
}

const launchCopy: Record<
  PublicLocale,
  { status: string; line: string; preview: string; collaboration: string }
> = {
  en: {
    status: "Pre-launch",
    line: "Structured matching, meetings and follow-up for cross-border business programs.",
    preview: "Explore the product preview",
    collaboration: "In collaboration with",
  },
  ms: {
    status: "Pra-pelancaran",
    line: "Lapisan operasi terkawal untuk program perniagaan rentas sempadan.",
    preview: "Terokai pratonton produk",
    collaboration: "Dengan kerjasama",
  },
  "zh-Hans": {
    status: "预发布",
    line: "面向跨境商务项目的规范化运营平台。",
    preview: "探索产品预览",
    collaboration: "合作单位",
  },
}

export async function SiteFooter({
  content,
  locale,
  currentPath = "/",
}: SiteFooterProps) {
  const branding = await getTenantBranding(content)
  const year = new Date().getFullYear()
  const labels = launchCopy[locale]
  const socialLinks = [
    {
      label: content.footer.social.linkedin,
      href: branding.socialLinks.linkedin,
      icon: Linkedin01Icon,
    },
    {
      label: content.footer.social.facebook,
      href: branding.socialLinks.facebook,
      icon: Facebook01Icon,
    },
  ]

  return (
    <footer className="bg-[#071326] px-4 py-12 text-[#dcecf7] sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 border-b border-white/12 pb-12 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href={withLocale("/", locale)} aria-label={branding.name}>
              <Image
                src={
                  branding.tenantId
                    ? branding.logoUrl
                    : "/plexus-wordmark-transparent-trimmed.png"
                }
                alt={branding.name}
                width={branding.tenantId ? 720 : 1933}
                height={branding.tenantId ? 215 : 311}
                className="h-auto w-44 object-contain object-left"
              />
            </Link>
            <p className="mt-6 max-w-sm text-xl leading-snug font-medium text-white">
              {labels.line}
            </p>
            <Link
              href={withLocale("/app", locale)}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#80e8ff] hover:text-white"
            >
              {labels.preview}
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={16}
                strokeWidth={1.8}
              />
            </Link>
          </div>

          <nav>
            <h2 className="text-sm font-semibold text-white">
              {content.footer.platform}
            </h2>
            <ul className="mt-5 grid gap-3">
              {content.footer.platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={withLocale(link.href, locale)}
                    className="text-sm text-[#aebed0] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={content.footer.company}>
            <h2 className="text-sm font-semibold text-white">
              {content.footer.company}
            </h2>
            <ul className="mt-5 grid gap-3">
              {content.footer.companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={withLocale(link.href, locale)}
                    className="text-sm text-[#aebed0] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div
              data-testid="footer-collaboration"
              className="mt-8 border-t border-white/12 pt-6"
            >
              <p className="text-xs font-semibold text-[#80e8ff]">
                {labels.collaboration}
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                YL Inspiration Sdn Bhd
              </p>
              <p className="mt-2 text-xs leading-5 text-[#aebed0]">
                Company No. 202301038393 (1532315-X)
              </p>
              <div className="mt-4 flex w-fit rounded-md bg-white px-3 py-2">
                <Image
                  src="/malaysia-digital.png"
                  alt="Malaysia Digital"
                  width={1152}
                  height={566}
                  sizes="104px"
                  className="h-7 w-auto object-contain"
                />
              </div>
              <p className="mt-4 text-sm font-semibold text-white">
                Malaysia Digital Status
              </p>
              <p className="mt-1 text-xs leading-5 text-[#aebed0]">
                MD File ID: MD/0002990
              </p>
            </div>
          </nav>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#80e8ff]/30 bg-[#80e8ff]/10 px-3 py-1.5 text-xs font-semibold text-[#80e8ff]">
              <span className="size-1.5 rounded-full bg-[#80e8ff]" />
              {labels.status}
            </div>
            <div className="mt-5 flex gap-2">
              {socialLinks
                .filter((item) => item.href !== "#")
                .map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="grid size-10 place-items-center rounded-lg border border-white/14 text-[#dcecf7] transition-colors hover:border-[#80e8ff]/50 hover:text-[#80e8ff]"
                  >
                    <HugeiconsIcon
                      icon={item.icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                  </Link>
                ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {publicLocales.map((item) => (
                <Link
                  key={item}
                  href={withLocale(currentPath, item)}
                  className={
                    locale === item
                      ? "text-sm font-semibold text-white"
                      : "text-sm text-[#aebed0] hover:text-white"
                  }
                >
                  {publicLocaleLabels[item]}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs text-[#8fa2b8] sm:flex-row sm:items-center sm:justify-between">
          <p>{content.footer.copyright.replace("{year}", String(year))}</p>
          <p>
            {branding.entityLine} · {content.footer.location}
            {branding.tenantId ? ` · ${content.footer.poweredBy}` : ""}
          </p>
        </div>
      </div>
    </footer>
  )
}

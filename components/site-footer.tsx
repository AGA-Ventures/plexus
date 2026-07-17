import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Facebook01Icon, Linkedin01Icon } from "@hugeicons/core-free-icons"

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
  en: "EN",
  ms: "Bahasa Malaysia",
  "zh-Hant": "繁體中文",
}

export async function SiteFooter({
  content,
  locale,
  currentPath = "/",
}: SiteFooterProps) {
  const branding = await getTenantBranding(content)
  const year = new Date().getFullYear()
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
    <footer className="border-t border-[#c7ceda]/12 bg-[#071326] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 text-sm text-[#c7ceda]/74 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Link
            href={withLocale("/", locale)}
            className="inline-flex items-center gap-3"
            aria-label={branding.name}
          >
            <Image
              src={branding.logoUrl}
              alt={branding.name}
              width={720}
              height={215}
              className="h-10 w-44 object-contain object-left"
            />
          </Link>
          <p className="mt-5 max-w-xs text-base leading-7 text-[#c7ceda]">
            {content.footer.tagline}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {socialLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="grid size-9 place-items-center rounded-md border border-[#c7ceda]/16 bg-white/5 text-[#25d0ff] transition hover:border-[#25d0ff]/40 hover:bg-[#25d0ff]/10"
                aria-label={item.label}
              >
                <HugeiconsIcon icon={item.icon} size={18} strokeWidth={1.8} />
              </Link>
            ))}
          </div>
          <details className="group mt-6 inline-block text-xs">
            <summary className="cursor-pointer rounded-md border border-[#c7ceda]/16 bg-white/5 px-3 py-2 text-[#c7ceda] transition hover:border-[#25d0ff]/40 hover:text-white">
              {content.footer.language}: {publicLocaleLabels[locale]}
            </summary>
            <div className="mt-2 grid gap-1 rounded-md border border-[#c7ceda]/16 bg-[#030b18] p-2 shadow-xl">
              {publicLocales.map((item) => (
                <Link
                  key={item}
                  href={withLocale(currentPath, item)}
                  className={[
                    "rounded px-3 py-2 transition hover:bg-[#0a84ff]/16 hover:text-white",
                    locale === item ? "text-[#25d0ff]" : "text-[#c7ceda]",
                  ].join(" ")}
                >
                  {publicLocaleLabels[item]}
                </Link>
              ))}
            </div>
          </details>
        </div>

        <FooterColumn
          title={content.footer.platform}
          links={content.footer.platformLinks}
          locale={locale}
        />
        <FooterColumn
          title={content.footer.company}
          links={content.footer.companyLinks}
          locale={locale}
        />
        <FooterColumn
          title={content.footer.legalSupport}
          links={content.footer.legalLinks}
          locale={locale}
        />
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-[#c7ceda]/12 pt-6 text-xs text-[#c7ceda]/62 sm:flex-row sm:items-center sm:justify-between">
        <p>{content.footer.copyright.replace("{year}", String(year))}</p>
        <p>
          {branding.entityLine} · {content.footer.location}
          {branding.tenantId ? (
            <span className="ml-2 rounded-sm border border-[#25d0ff]/24 bg-[#25d0ff]/8 px-2 py-1 text-[#25d0ff]">
              {content.footer.poweredBy}
            </span>
          ) : null}
        </p>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
  locale,
}: {
  title: string
  links: Array<{ label: string; href: string }>
  locale: PublicLocale
}) {
  return (
    <nav>
      <h2 className="text-xs font-semibold tracking-[0.22em] text-[#d4af37] uppercase">
        {title}
      </h2>
      <ul className="mt-4 grid gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={withLocale(link.href, locale)}
              className="text-[#c7ceda] transition hover:text-[#25d0ff]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

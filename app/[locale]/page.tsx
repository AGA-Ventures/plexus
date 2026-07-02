import { notFound, redirect } from "next/navigation"

import { isLocaleParam, normalizeLocale } from "@/lib/i18n"

export default async function LocaleIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  redirect(`/${normalizeLocale(locale)}/admin`)
}

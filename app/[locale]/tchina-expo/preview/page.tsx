import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TChinaExpoRegistrationForm } from "@/components/tchina-expo-registration-form"
import { getTChinaLocalPreviewEvent } from "@/lib/tchina-expo-preview"
import { isTChinaLocale } from "@/lib/tchina-expo"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "TChina Expo 2026 local preview",
  robots: { index: false, follow: false },
}

export default async function TChinaExpoPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isTChinaLocale(locale)) notFound()

  const event = getTChinaLocalPreviewEvent()
  if (!event) notFound()

  return (
    <TChinaExpoRegistrationForm locale={locale} event={event} previewMode />
  )
}

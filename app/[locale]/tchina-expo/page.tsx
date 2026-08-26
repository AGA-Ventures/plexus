import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { TChinaExpoRegistrationForm } from "@/components/tchina-expo-registration-form"
import { getPublishedTChinaEvent } from "@/lib/tchina-expo-server"
import { isTChinaLocale } from "@/lib/tchina-expo"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "TChina Expo 2026 registration",
  description: "Registration questionnaire for TChina Expo 2026 in Guangzhou.",
  robots: { index: false, follow: false },
}

export default async function TChinaExpoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isTChinaLocale(locale)) notFound()

  const event = await getPublishedTChinaEvent()
  if (!event) notFound()

  return <TChinaExpoRegistrationForm locale={locale} event={event} />
}

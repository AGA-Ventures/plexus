import type { Metadata } from "next"

import { getLegalMetadata, LegalDocument } from "@/components/legal-document"
import { normalizeLocale } from "@/lib/i18n"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return getLegalMetadata("privacy", normalizeLocale(locale))
}

export default function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return <LegalDocument kind="privacy" params={params} />
}

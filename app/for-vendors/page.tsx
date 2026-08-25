import { redirect } from "next/navigation"

import { normalizePublicLocale, withLocale } from "@/lib/public-site"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const params = await searchParams
  redirect(
    withLocale("/for-program-operators", normalizePublicLocale(params.lang))
  )
}

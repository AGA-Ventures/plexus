import { PublicLegalPage } from "@/components/public-page"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  return <PublicLegalPage slug="privacy" searchParams={searchParams} />
}

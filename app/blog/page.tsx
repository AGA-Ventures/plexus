import { PublicMarketingPage } from "@/components/public-page"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  return <PublicMarketingPage slug="blog" searchParams={searchParams} />
}

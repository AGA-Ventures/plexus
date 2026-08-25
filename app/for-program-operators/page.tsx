import { PublicMarketingPage } from "@/components/public-page"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  return (
    <PublicMarketingPage
      slug="for-vendors"
      searchParams={searchParams}
      currentPath="/for-program-operators"
    />
  )
}

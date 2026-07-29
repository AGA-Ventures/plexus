import { redirect } from "next/navigation"

export default async function PublicPartnerRegistrationRootPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string | string[] }>
}) {
  const { tenant } = await searchParams
  const slug = Array.isArray(tenant) ? tenant[0] : tenant
  const query = slug ? `?tenant=${encodeURIComponent(slug)}` : ""

  redirect(`/en/register${query}`)
}

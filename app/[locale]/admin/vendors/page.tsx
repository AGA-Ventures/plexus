import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AdminVendorConsole } from "@/components/admin-vendor-console"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import { getAdminManagementData } from "@/lib/management-data"

export const metadata: Metadata = {
  title: "Tenant Vendor Management · Plexus",
  description: "Tenant-scoped Vendor company and account management.",
}

export default async function AdminVendorManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const data = await getAdminManagementData(normalizedLocale)

  return <AdminVendorConsole locale={normalizedLocale} {...data} />
}

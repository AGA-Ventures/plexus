import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { VendorApplicationForm } from "@/components/vendor-application-form"
import { isLocaleParam } from "@/lib/i18n"
import { getActiveVendorApplicationTenant } from "@/lib/vendor-application-server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Vendor company application",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function VendorSignupPage({
  params,
}: {
  params: Promise<{
    locale: string
    tenantSlug: string
    vendorType: string
  }>
}) {
  const { locale, tenantSlug, vendorType } = await params

  if (
    !isLocaleParam(locale) ||
    !["delegation", "partner"].includes(vendorType)
  ) {
    notFound()
  }

  const tenant = await getActiveVendorApplicationTenant(tenantSlug)

  if (!tenant) {
    notFound()
  }

  return (
    <VendorApplicationForm
      vendorType={vendorType as "delegation" | "partner"}
      branding={tenant.branding}
    />
  )
}

import { notFound } from "next/navigation"

import { PublicPartnerRegistrationForm } from "@/components/public-partner-registration-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getLoginBranding } from "@/lib/login-branding"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"

export default async function PublicPartnerRegistrationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tenant?: string | string[] }>
}) {
  const { locale } = await params
  const { tenant } = await searchParams

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const branding = await getLoginBranding(
    Array.isArray(tenant) ? tenant[0] : tenant
  )

  if (branding.mode !== "tenant" || !branding.slug) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] p-6">
        <Alert variant="destructive" className="max-w-lg p-5">
          <AlertTitle>Registration link unavailable</AlertTitle>
          <AlertDescription>
            Ask the organizer for the complete company-registration link.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <PublicPartnerRegistrationForm
      locale={normalizedLocale}
      branding={{ ...branding, mode: "tenant", slug: branding.slug }}
    />
  )
}

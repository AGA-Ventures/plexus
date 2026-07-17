import Link from "next/link"

import {
  complianceVendors,
  getComplianceVendorStatus,
  type ComplianceVendorId,
} from "@/lib/compliance"
import { localeLabels, locales, type Locale } from "@/lib/i18n"
import { supportedMarkets } from "@/lib/markets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type ComplianceView = "overview" | "world-check" | "malaysia"

const viewCopy: Record<
  ComplianceView,
  {
    title: string
    description: string
  }
> = {
  overview: {
    title: "Compliance integrations",
    description:
      "Admin readiness for AML watchlist screening and Malaysia corporate checks.",
  },
  "world-check": {
    title: "World-Check AML screening",
    description:
      "International screening route for sanctions, PEP, adverse media and AML watchlist checks.",
  },
  malaysia: {
    title: "Malaysia SSM / CTOS checks",
    description:
      "Malaysia company registry and corporate credit routes for Malaysian partner due diligence.",
  },
}

const navItems: Array<{ view: ComplianceView; label: string; href: string }> = [
  { view: "overview", label: "Overview", href: "compliance" },
  { view: "world-check", label: "World-Check", href: "compliance/world-check" },
  {
    view: "malaysia",
    label: "SSM / CTOS",
    href: "compliance/malaysia-ssm-ctos",
  },
]

function statusVariant(status: string) {
  return status === "configured" ? "default" : "outline"
}

function vendorIdsForView(view: ComplianceView): ComplianceVendorId[] {
  if (view === "world-check") {
    return ["worldCheck"]
  }

  if (view === "malaysia") {
    return ["ssm", "ctos"]
  }

  return ["worldCheck", "ssm", "ctos"]
}

export function ComplianceConsole({
  locale,
  view,
}: {
  locale: Locale
  view: ComplianceView
}) {
  const copy = viewCopy[view]
  const vendorStatuses = getComplianceVendorStatus().filter((vendor) =>
    vendorIdsForView(view).includes(vendor.id)
  )
  const worldCheck = complianceVendors.worldCheck
  const ssm = complianceVendors.ssm
  const ctos = complianceVendors.ctos

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <Link href={`/${locale}/admin`} className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-[#052b2d] text-sm font-semibold text-[#f4c45b]">
                PX
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold">Plexus Connect</span>
                <span className="text-xs text-muted-foreground">
                  Compliance console
                </span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {locales.map((item) => (
                <Button
                  key={item}
                  asChild
                  size="sm"
                  variant={locale === item ? "secondary" : "outline"}
                >
                  <Link
                    href={`/${item}/${navItems.find((nav) => nav.view === view)?.href}`}
                  >
                    {localeLabels[item]}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Button
                key={item.view}
                asChild
                size="sm"
                variant={view === item.view ? "default" : "outline"}
              >
                <Link href={`/${locale}/${item.href}`}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Admin due diligence
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            {copy.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {copy.description}
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {vendorStatuses.map((vendor) => (
            <Card key={vendor.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{vendor.label}</CardTitle>
                  <Badge variant={statusVariant(vendor.status)}>
                    {vendor.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription>{vendor.purpose}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-xs text-muted-foreground">
                {vendor.requiredEnv.map((name) => (
                  <code key={name} className="rounded bg-muted px-2 py-1">
                    {name}
                  </code>
                ))}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Backend routes</CardTitle>
              <CardDescription>
                Route handlers are admin-protected and ready for vendor
                credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="rounded-md border p-3">
                <p className="font-medium">GET /api/compliance/vendors</p>
                <p className="mt-1 text-muted-foreground">
                  Returns configuration status for {worldCheck.label},{" "}
                  {ssm.label} and {ctos.label}.
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="font-medium">POST /api/compliance/screening</p>
                <p className="mt-1 text-muted-foreground">
                  Validates company details, runs World-Check for all markets,
                  and runs SSM/CTOS only when the company country is Malaysia.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Screening payload</CardTitle>
              <CardDescription>
                The vendor adapters accept this normalized company input.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs leading-5">
                {JSON.stringify(
                  {
                    companyName: "Example Sdn Bhd",
                    registrationNumber: "202601234567",
                    countryRegion: "Malaysia",
                    contactName: "Primary contact",
                    checkTypes: ["worldCheck", "ssm", "ctos"],
                  },
                  null,
                  2
                )}
              </pre>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Supported country / region routes</CardTitle>
            <CardDescription>
              The current market list contains {supportedMarkets.length}{" "}
              entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {supportedMarkets.map((market) => (
                <div
                  key={market.code}
                  className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
                >
                  <span>
                    {market.nameEn}{" "}
                    <span className="text-muted-foreground">
                      ({market.nameNative})
                    </span>
                  </span>
                  <Badge variant="outline">{market.defaultLocale}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

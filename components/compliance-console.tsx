import Link from "next/link"

import { AdminWorkspaceRouteNavigation } from "@/components/malayconnect-mvp"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n"
import type { PortalSession } from "@/lib/plexus-data"

export function ComplianceConsole({
  locale,
  session,
}: {
  locale: Locale
  session: PortalSession
}) {
  if (session.role === "admin") {
    return (
      <main className="min-h-svh bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 pb-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <AdminWorkspaceRouteNavigation
              locale={locale}
              session={session}
              activeHref={`/${locale}/compliance`}
            />
            <section
              aria-label="Compliance"
              className="flex min-h-[calc(100svh-2.5rem)] items-center justify-center"
            >
              <Badge variant="secondary">Pending</Badge>
            </section>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Button asChild variant="outline">
          <Link href={`/${locale}/superadmin`}>
            Back to platform control center
          </Link>
        </Button>
        <Badge variant="secondary">Pending</Badge>
      </div>
    </main>
  )
}

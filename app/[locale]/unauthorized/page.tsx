import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"

export default async function LocaleUnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params

  if (!isLocaleParam(localeParam)) {
    notFound()
  }

  const locale = normalizeLocale(localeParam)

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account setup required</CardTitle>
          <CardDescription>
            This Supabase account is signed in, but it has no launch role in app metadata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ask an admin to set one of: admin, delegation, or partner.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href={`/${locale}/login`}>Back to login</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}


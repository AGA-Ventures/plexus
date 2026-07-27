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
            This account is signed in, but its trusted role or tenant binding is
            missing, inactive, or inconsistent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ask an authorized operator to verify the account profile and trusted
            claims. Admin accounts require an active <code>admin_id</code>;
            Vendor accounts require matching <code>admin_id</code>,{" "}
            <code>vendor_company_id</code>, and <code>vendor_type</code>{" "}
            bindings.
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

import Link from "next/link"
import { headers } from "next/headers"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { normalizePublicLocale, withLocale } from "@/lib/public-site"

const copy = {
  en: {
    title: "Page not found",
    body: "This page is unavailable. Return to the Plexus home page or sign in from your workspace link.",
    action: "Back to home",
  },
  ms: {
    title: "Halaman tidak ditemui",
    body: "Halaman ini tidak tersedia. Kembali ke laman utama Plexus atau log masuk daripada pautan ruang kerja anda.",
    action: "Kembali ke laman utama",
  },
  "zh-Hans": {
    title: "找不到页面",
    body: "此页面无法访问。请返回 Plexus 首页，或通过您的工作区链接登录。",
    action: "返回首页",
  },
}

export default async function NotFound() {
  const headerStore = await headers()
  const locale = normalizePublicLocale(
    headerStore.get("x-plexus-language") ?? undefined
  )
  const content = copy[locale]

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            {content.title}
          </CardTitle>
          <CardDescription>{content.body}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link href={withLocale("/", locale)}>{content.action}</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}

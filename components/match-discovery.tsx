"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { requestMatchAction } from "@/app/actions/plexus"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Locale } from "@/lib/i18n"

export type MatchCandidate = {
  id: string
  name_en: string
  name_cn: string
  sector: string
}

function tr(locale: Locale, en: string, zh: string) {
  return locale === "zh" || locale === "zh-Hant" ? zh : en
}

export function MatchDiscovery({
  role,
  locale,
  candidates,
  matchedIds,
}: {
  role: "delegation" | "partner"
  locale: Locale
  candidates: MatchCandidate[]
  matchedIds: string[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [matched, setMatched] = useState<Set<string>>(new Set(matchedIds))
  const [pendingId, setPendingId] = useState<string | null>(null)

  const counterpartLabel =
    role === "delegation"
      ? tr(locale, "Malaysian partners", "马来西亚伙伴")
      : tr(locale, "delegation companies", "代表团企业")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    if (!q) {
      return candidates
    }

    return candidates.filter(
      (candidate) =>
        candidate.name_en.toLowerCase().includes(q) ||
        candidate.name_cn.toLowerCase().includes(q) ||
        candidate.sector.toLowerCase().includes(q)
    )
  }, [candidates, query])

  async function requestMatch(candidate: MatchCandidate) {
    setPendingId(candidate.id)

    try {
      const result = await requestMatchAction(candidate.id)

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setMatched((current) => new Set(current).add(candidate.id))
      toast.success(
        tr(
          locale,
          `Match requested with ${candidate.name_en}.`,
          `已向 ${candidate.name_en} 发起配对。`
        )
      )
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Match request failed."
      )
    } finally {
      setPendingId(null)
    }
  }

  return (
    <main className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-5 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold">
              {tr(locale, "Search for your match", "搜索您的配对")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {tr(
                locale,
                `Browse all ${counterpartLabel} and request a match. Only company name and sector are shown.`,
                `浏览所有${counterpartLabel}并发起配对。仅显示企业名称与行业。`
              )}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/vendor`}>
              {tr(locale, "Back to portal", "返回门户")}
            </Link>
          </Button>
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tr(
            locale,
            "Search by company name or sector",
            "按企业名称或行业搜索"
          )}
        />

        <p className="text-sm text-muted-foreground">
          {filtered.length} {tr(locale, "companies", "家企业")}
        </p>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tr(locale, "No companies found.", "未找到企业。")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((candidate) => {
              const isMatched = matched.has(candidate.id)

              return (
                <Card key={candidate.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {candidate.name_en}
                    </CardTitle>
                    {candidate.name_cn ? (
                      <CardDescription>{candidate.name_cn}</CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="mt-auto flex items-center justify-between gap-3">
                    <Badge variant="secondary">{candidate.sector}</Badge>
                    <Button
                      onClick={() => requestMatch(candidate)}
                      disabled={isMatched || pendingId === candidate.id}
                    >
                      {isMatched
                        ? tr(locale, "Matched", "已配对")
                        : tr(locale, "Match", "配对")}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

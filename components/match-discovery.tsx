"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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
    <section
      className="flex min-w-0 flex-col gap-5"
      aria-labelledby="match-discovery-title"
    >
      <Card>
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1.5">
            <CardTitle id="match-discovery-title" className="text-2xl">
              {tr(locale, "Search for your match", "搜索您的配对")}
            </CardTitle>
            <CardDescription>
              {tr(
                locale,
                `Browse all ${counterpartLabel} and request a match. Only company name and sector are shown.`,
                `浏览所有${counterpartLabel}并发起配对。仅显示企业名称与行业。`
              )}
            </CardDescription>
          </div>
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto"
            data-testid="back-to-my-matches"
          >
            <Link href={`/${locale}/vendor?section=matches`}>
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                data-icon="inline-start"
                strokeWidth={1.7}
              />
              {locale === "zh-Hant"
                ? "返回我的配對"
                : tr(locale, "Back to My matches", "返回我的配对")}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr(
              locale,
              "Search by company name or sector",
              "按企业名称或行业搜索"
            )}
          />
          <Badge variant="outline" className="w-fit">
            {filtered.length} {tr(locale, "companies", "家企业")}
          </Badge>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {tr(locale, "No companies found.", "未找到企业。")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
    </section>
  )
}

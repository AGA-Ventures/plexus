import type { DelegationCompany, PartnerCompany } from "@/lib/local-db"

export type MatchScoreInput = {
  delegation: Pick<DelegationCompany, "sector" | "needs" | "profileComplete">
  partner: Pick<PartnerCompany, "sector" | "offerings" | "verified" | "profileComplete">
}

export type MatchScore = {
  score: number
  reasons: string[]
}

const STOPWORDS = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "for",
  "to",
  "of",
  "in",
  "on",
  "with",
  "seeking",
  "looking",
  "needs",
  "need",
  "local",
  "support",
  "partners",
  "partner",
  "company",
  "companies",
])

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word))
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Deterministic, explainable fit score between a delegation company's stated
 * needs and a Malaysian partner's offerings. Returns a 0-100 score plus the
 * human-readable reasons that produced it. Used both for the admin matching
 * preview and server-side when a match is created, so the stored score reflects
 * real profile data instead of a hardcoded constant.
 */
export function scoreMatch({ delegation, partner }: MatchScoreInput): MatchScore {
  const reasons: string[] = []
  let score = 0

  const delegationSector = delegation.sector.trim().toLowerCase()
  const partnerSector = partner.sector.trim().toLowerCase()

  if (delegationSector && delegationSector === partnerSector) {
    score += 45
    reasons.push(`Exact sector match (${partner.sector})`)
  } else if (delegationSector && partnerSector) {
    const sectorOverlap = [...tokenize(delegation.sector)].some((token) =>
      tokenize(partner.sector).has(token)
    )
    if (sectorOverlap) {
      score += 22
      reasons.push("Related sector overlap")
    }
  }

  const needTokens = tokenize(delegation.needs)
  const offerTokens = tokenize(partner.offerings)
  const sharedTokens = [...needTokens].filter((token) => offerTokens.has(token))

  if (needTokens.size > 0) {
    const overlapRatio = sharedTokens.length / needTokens.size
    const keywordPoints = Math.round(clamp(overlapRatio, 0, 1) * 35)
    if (keywordPoints > 0) {
      score += keywordPoints
      reasons.push(
        `Needs/offerings keyword overlap: ${sharedTokens.slice(0, 4).join(", ")}`
      )
    }
  }

  if (partner.verified === "Verified") {
    score += 10
    reasons.push("Partner verified")
  } else if (partner.verified === "Pending") {
    score += 4
  }

  const readiness = Math.round(((delegation.profileComplete + partner.profileComplete) / 2 / 100) * 10)
  score += readiness
  if (readiness >= 8) {
    reasons.push("Both profiles near complete")
  }

  if (reasons.length === 0) {
    reasons.push("Low automatic fit — review manually")
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    reasons,
  }
}

export function matchNoteFromScore(result: MatchScore): string {
  return `Auto-scored ${result.score}% fit. ${result.reasons.join("; ")}.`
}

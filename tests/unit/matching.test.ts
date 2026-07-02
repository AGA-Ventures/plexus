import { describe, expect, it } from "vitest"

import { matchNoteFromScore, scoreMatch } from "@/lib/matching"

const verifiedPartner = {
  sector: "Smart Mobility",
  offerings: "Charging operations, municipal EV rollout and maintenance teams.",
  verified: "Verified" as const,
  profileComplete: 96,
}

const evDelegation = {
  sector: "Smart Mobility",
  needs: "Seeking Malaysian EV charging operators, fleet partners and local assembly routes.",
  profileComplete: 92,
}

describe("scoreMatch", () => {
  it("rewards an exact sector match plus keyword overlap with a high score", () => {
    const result = scoreMatch({ delegation: evDelegation, partner: verifiedPartner })
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.reasons.join(" ")).toContain("Exact sector match")
  })

  it("scores an unrelated partner low", () => {
    const result = scoreMatch({
      delegation: evDelegation,
      partner: {
        sector: "AgriTech",
        offerings: "Pilot farms, grants facilitation and agri exporter introductions.",
        verified: "Pending",
        profileComplete: 40,
      },
    })
    expect(result.score).toBeLessThan(45)
  })

  it("is deterministic for the same input", () => {
    const a = scoreMatch({ delegation: evDelegation, partner: verifiedPartner })
    const b = scoreMatch({ delegation: evDelegation, partner: verifiedPartner })
    expect(a.score).toBe(b.score)
  })

  it("always clamps the score into the 0-100 range", () => {
    const result = scoreMatch({
      delegation: { sector: "", needs: "", profileComplete: 0 },
      partner: { sector: "", offerings: "", verified: "Flagged", profileComplete: 0 },
    })
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
    expect(result.reasons.length).toBeGreaterThan(0)
  })

  it("gives a verified partner more credit than a pending one, all else equal", () => {
    const base = { ...verifiedPartner, verified: "Pending" as const }
    const verified = scoreMatch({ delegation: evDelegation, partner: verifiedPartner }).score
    const pending = scoreMatch({ delegation: evDelegation, partner: base }).score
    expect(verified).toBeGreaterThan(pending)
  })
})

describe("matchNoteFromScore", () => {
  it("embeds the score and reasons in the stored note", () => {
    const result = scoreMatch({ delegation: evDelegation, partner: verifiedPartner })
    const note = matchNoteFromScore(result)
    expect(note).toContain(`${result.score}%`)
    expect(note).toContain("Auto-scored")
  })
})

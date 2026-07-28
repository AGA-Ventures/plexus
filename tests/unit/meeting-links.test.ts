import { describe, expect, it } from "vitest"

import {
  getProtectedMeetingPath,
  toMeetingHref,
  toShareableMeetingLink,
} from "@/lib/meeting-links"

const PRODUCTION = "https://www.plexus.enterprises"
const SLUG = "Kzq_vrYVjny9402inyHN7MM5RTfilqiX"

describe("protected meeting link origins", () => {
  it("rebuilds a link created on another origin onto the live one", () => {
    // A meeting created against a development server must never hand a
    // localhost URL to a Vendor viewing production.
    expect(
      toShareableMeetingLink(`http://localhost:3000/m/${SLUG}`, PRODUCTION)
    ).toBe(`${PRODUCTION}/m/${SLUG}`)

    expect(toShareableMeetingLink(`${PRODUCTION}/m/${SLUG}`, PRODUCTION)).toBe(
      `${PRODUCTION}/m/${SLUG}`
    )
  })

  it("renders protected links as relative paths so the live host resolves them", () => {
    expect(toMeetingHref(`http://localhost:3000/m/${SLUG}`)).toBe(`/m/${SLUG}`)
    expect(toMeetingHref(undefined)).toBeUndefined()
    expect(toMeetingHref("")).toBe("")
  })

  it("leaves legacy external provider links untouched", () => {
    const legacy = "https://zoom.us/j/local-demo-ses-2"

    expect(getProtectedMeetingPath(legacy)).toBeNull()
    expect(toMeetingHref(legacy)).toBe(legacy)
    expect(toShareableMeetingLink(legacy, PRODUCTION)).toBe(legacy)
  })

  it("rejects anything that is not a single-segment protected path", () => {
    expect(getProtectedMeetingPath("https://evil.example/m/a/b")).toBeNull()
    expect(getProtectedMeetingPath("https://evil.example/mm/abc")).toBeNull()
    expect(getProtectedMeetingPath("not a url at all")).toBeNull()
    expect(getProtectedMeetingPath(undefined)).toBeNull()
  })

  it("keeps only the path, discarding a foreign host's query and hash", () => {
    expect(
      toShareableMeetingLink(
        `https://attacker.example/m/${SLUG}?next=https://attacker.example#x`,
        PRODUCTION
      )
    ).toBe(`${PRODUCTION}/m/${SLUG}`)
  })
})

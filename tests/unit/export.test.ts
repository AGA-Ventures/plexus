import { describe, expect, it } from "vitest"

import { toCsv, toIcs } from "@/lib/export"

describe("toCsv", () => {
  const rows = [
    { name: "Hengqin Smart Mobility", sector: "Smart Mobility", score: 94 },
    { name: 'Comma, Inc "MY"', sector: "Multi\nline", score: 0 },
  ]
  const columns = [
    { header: "Name", value: (row: (typeof rows)[number]) => row.name },
    { header: "Sector", value: (row: (typeof rows)[number]) => row.sector },
    { header: "Score", value: (row: (typeof rows)[number]) => row.score },
  ]

  it("writes a header row and one row per record", () => {
    const csv = toCsv(rows, columns)
    const lines = csv.replace(/^﻿/, "").split("\r\n")
    expect(lines[0]).toBe("Name,Sector,Score")
    expect(lines).toHaveLength(3)
  })

  it("escapes commas, quotes and newlines", () => {
    const csv = toCsv(rows, columns)
    expect(csv).toContain('"Comma, Inc ""MY"""')
    expect(csv).toContain('"Multi\nline"')
  })

  it("prepends a UTF-8 BOM so Excel reads Chinese characters", () => {
    const csv = toCsv([{ name: "横琴" }], [{ header: "名称", value: (r) => r.name }])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })
})

describe("toIcs", () => {
  it("produces a valid VCALENDAR with one VEVENT per event", () => {
    const ics = toIcs([
      {
        uid: "ses-1",
        title: "Delegation ↔ Partner",
        start: new Date("2026-07-08T10:00:00+08:00"),
        durationMinutes: 45,
        location: "VooV",
        description: "Prep session",
      },
    ])
    expect(ics).toContain("BEGIN:VCALENDAR")
    expect(ics).toContain("END:VCALENDAR")
    expect(ics).toContain("BEGIN:VEVENT")
    expect(ics).toContain("UID:ses-1@plexus-connect")
    expect(ics).toContain("SUMMARY:Delegation ↔ Partner")
  })

  it("escapes commas in text fields", () => {
    const ics = toIcs([
      {
        uid: "x",
        title: "A, B, C",
        start: new Date("2026-07-08T10:00:00Z"),
        durationMinutes: 30,
      },
    ])
    expect(ics).toContain("SUMMARY:A\\, B\\, C")
  })
})

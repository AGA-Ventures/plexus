/**
 * Client-side file export helpers. These generate real downloadable files
 * (CSV for tabular data, ICS for calendar itineraries) instead of the
 * placeholder toasts the MVP shipped with.
 */

export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | boolean | null | undefined
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",")
  const body = rows
    .map((row) => columns.map((column) => escapeCsvCell(column.value(row))).join(","))
    .join("\r\n")
  // Prepend BOM so Excel opens UTF-8 (Chinese names) correctly.
  return `﻿${header}\r\n${body}`
}

function triggerDownload(blob: Blob, filename: string) {
  if (typeof window === "undefined") {
    return
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function timestampedName(base: string, extension: string): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `${base}-${stamp}.${extension}`
}

export function downloadCsv<T>(baseName: string, rows: T[], columns: CsvColumn<T>[]) {
  const blob = new Blob([toCsv(rows, columns)], { type: "text/csv;charset=utf-8" })
  triggerDownload(blob, timestampedName(baseName, "csv"))
}

export type CalendarEvent = {
  uid: string
  title: string
  start: Date
  durationMinutes: number
  location?: string
  description?: string
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

export function toIcs(events: CalendarEvent[], calendarName = "Plexus Connect"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plexus Connect//Event Portal//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ]

  for (const event of events) {
    const end = new Date(event.start.getTime() + event.durationMinutes * 60_000)
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}@plexus-connect`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(event.start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcsText(event.title)}`
    )
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`)
    }
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`)
    }
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n")
}

export function downloadIcs(baseName: string, events: CalendarEvent[], calendarName?: string) {
  const blob = new Blob([toIcs(events, calendarName)], { type: "text/calendar;charset=utf-8" })
  triggerDownload(blob, timestampedName(baseName, "ics"))
}

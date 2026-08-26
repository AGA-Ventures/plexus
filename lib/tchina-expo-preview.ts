import type { TChinaPublicEvent } from "@/lib/tchina-expo-server"

const tchinaLocalPreviewEvent = {
  id: "00000000-0000-4000-8000-000000000001",
  title: "TChina Expo 2026 · Local preview",
  city: "Guangzhou",
  venue_name: "Venue to be confirmed",
  venue_address: "Configure the exact Guangzhou address before activation",
  organizer_name: "Organizer to be confirmed",
  support_email: "preview@example.invalid",
  starts_on: "2026-08-31",
  ends_on: "2026-09-04",
  timezone: "Asia/Shanghai",
} satisfies TChinaPublicEvent

export function getTChinaLocalPreviewEvent(
  runtime = process.env.NODE_ENV
): TChinaPublicEvent | null {
  if (runtime !== "development") return null

  return tchinaLocalPreviewEvent
}

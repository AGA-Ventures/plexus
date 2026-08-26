import "server-only"

import {
  createSupabaseAdminClient,
  hasSupabaseAdminSecret,
} from "@/lib/supabase/admin"
import type { TChinaEvent } from "@/lib/tchina-expo"

export type TChinaPublicEvent = Pick<
  TChinaEvent,
  | "id"
  | "title"
  | "city"
  | "venue_name"
  | "venue_address"
  | "organizer_name"
  | "support_email"
  | "starts_on"
  | "ends_on"
  | "timezone"
>

export async function getPublishedTChinaEvent(): Promise<TChinaPublicEvent | null> {
  if (!hasSupabaseAdminSecret()) return null

  const result = await createSupabaseAdminClient()
    .from("tchina_events")
    .select(
      "id, title, city, venue_name, venue_address, organizer_name, support_email, starts_on, ends_on, timezone"
    )
    .eq("singleton_key", "plexus")
    .eq("registration_open", true)
    .maybeSingle()

  if (result.error || !result.data) return null
  return result.data as TChinaPublicEvent
}

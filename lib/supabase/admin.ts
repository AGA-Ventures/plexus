import "server-only"

import { createClient } from "@supabase/supabase-js"

import { getSupabaseConfig } from "@/lib/supabase/config"

export function hasSupabaseAdminSecret() {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export function createSupabaseAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secretKey) {
    throw new Error(
      "Set SUPABASE_SECRET_KEY on the server to provision or suspend accounts."
    )
  }

  const { url } = getSupabaseConfig()

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

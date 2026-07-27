import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.PLEXUS_SUPERADMIN_EMAIL
const password = process.env.PLEXUS_SUPERADMIN_PASSWORD
const displayName = process.env.PLEXUS_SUPERADMIN_NAME

function required(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}.`)
  }

  return value
}

required("NEXT_PUBLIC_SUPABASE_URL", url)
required("SUPABASE_SECRET_KEY", secretKey)
required("PLEXUS_SUPERADMIN_EMAIL", email)
required("PLEXUS_SUPERADMIN_NAME", displayName)
required("PLEXUS_SUPERADMIN_PASSWORD", password)

if (password.length < 12) {
  throw new Error("PLEXUS_SUPERADMIN_PASSWORD must be at least 12 characters.")
}

const supabase = createClient(url, secretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

const existing = await supabase
  .from("user_profiles")
  .select("id", { count: "exact", head: true })
  .eq("role", "superadmin")

if (existing.error) {
  throw new Error(`Unable to inspect Superadmin profiles: ${existing.error.message}`)
}

if (
  (existing.count ?? 0) > 0 &&
  process.env.PLEXUS_ALLOW_ADDITIONAL_SUPERADMIN !== "true"
) {
  throw new Error(
    "A Superadmin already exists. Use an approved operator workflow, or set PLEXUS_ALLOW_ADDITIONAL_SUPERADMIN=true after review."
  )
}

const authResult = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "superadmin" },
  user_metadata: { display_name: displayName },
})

if (authResult.error || !authResult.data.user) {
  throw new Error(
    `Unable to create the Auth user: ${authResult.error?.message ?? "Unknown error"}`
  )
}

const userId = authResult.data.user.id
const profileResult = await supabase.from("user_profiles").insert({
  id: userId,
  role: "superadmin",
  display_name: displayName,
  email,
  active: true,
})

if (profileResult.error) {
  await supabase.auth.admin.deleteUser(userId)
  throw new Error(
    `Unable to create the Superadmin profile: ${profileResult.error.message}`
  )
}

process.stdout.write(`Superadmin provisioned for ${email} (${userId}).\n`)

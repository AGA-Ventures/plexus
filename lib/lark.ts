import "server-only"

import { createHash } from "node:crypto"
import { z } from "zod"

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin"

const LARK_API_ORIGIN = "https://open.larksuite.com"
const LARK_AUTHORIZE_URL =
  "https://accounts.larksuite.com/open-apis/authen/v1/authorize"
const LARK_TOKEN_URL = `${LARK_API_ORIGIN}/open-apis/authen/v2/oauth/token`
const LARK_RESERVE_URL = `${LARK_API_ORIGIN}/open-apis/vc/v1/reserves/apply`
const LARK_SCOPES = "vc:reserve vc:reserve:readonly offline_access"
const REQUEST_TIMEOUT_MS = 15_000
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000

const larkTokenResponseSchema = z.object({
  code: z.union([z.literal(0), z.literal("0")]),
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  refresh_token: z.string().min(1),
  refresh_token_expires_in: z.number().int().positive().optional(),
})

const larkReserveResponseSchema = z.object({
  code: z.union([z.literal(0), z.literal("0")]),
  data: z.object({
    reserve: z.object({
      url: z.url(),
      meeting_no: z.union([z.string(), z.number()]),
    }),
  }),
})

let larkTokenRefreshInFlight: Promise<string> | undefined

function requiredLarkEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required Lark configuration: ${name}.`)
  }

  return value
}

export function createLarkCodeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url")
}

export function getLarkAuthorizationUrl(input: {
  state: string
  codeChallenge: string
}) {
  const url = new URL(LARK_AUTHORIZE_URL)
  url.searchParams.set("client_id", requiredLarkEnv("LARK_APP_ID"))
  url.searchParams.set("redirect_uri", requiredLarkEnv("LARK_REDIRECT_URI"))
  url.searchParams.set("scope", LARK_SCOPES)
  url.searchParams.set("state", input.state)
  url.searchParams.set("code_challenge", input.codeChallenge)
  url.searchParams.set("code_challenge_method", "S256")
  return url
}

async function requestLarkToken(
  body:
    | {
        grant_type: "authorization_code"
        code: string
        redirect_uri: string
        code_verifier: string
      }
    | {
        grant_type: "refresh_token"
        refresh_token: string
      }
) {
  const response = await fetch(LARK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      client_id: requiredLarkEnv("LARK_APP_ID"),
      client_secret: requiredLarkEnv("LARK_APP_SECRET"),
      ...body,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Lark authorization failed with HTTP ${response.status}.`)
  }

  const parsed = larkTokenResponseSchema.safeParse(await response.json())

  if (!parsed.success) {
    throw new Error("Lark returned an invalid authorization response.")
  }

  return parsed.data
}

async function persistLarkToken(
  token: z.infer<typeof larkTokenResponseSchema>
) {
  const now = Date.now()
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("oauth_tokens").upsert({
    id: "lark",
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: new Date(now + token.expires_in * 1000).toISOString(),
    refresh_token_expires_at: token.refresh_token_expires_in
      ? new Date(now + token.refresh_token_expires_in * 1000).toISOString()
      : null,
    updated_at: new Date(now).toISOString(),
  })

  if (error) {
    throw new Error("Unable to store the Lark authorization.")
  }
}

export async function exchangeLarkAuthorizationCode(input: {
  code: string
  codeVerifier: string
}) {
  const token = await requestLarkToken({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: requiredLarkEnv("LARK_REDIRECT_URI"),
    code_verifier: input.codeVerifier,
  })

  await persistLarkToken(token)
}

async function refreshLarkUserAccessToken(refreshToken: string) {
  const token = await requestLarkToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })
  await persistLarkToken(token)
  return token.access_token
}

export async function getLarkUserAccessToken() {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("id", "lark")
    .maybeSingle()

  if (error) {
    throw new Error("Unable to read the Lark authorization.")
  }

  if (!data?.refresh_token) {
    throw new Error("Lark is not authorized. Sign in once at /api/lark/login.")
  }

  const expiresAt = data.expires_at
    ? new Date(data.expires_at).getTime()
    : Number.NaN

  if (
    data.access_token &&
    Number.isFinite(expiresAt) &&
    expiresAt - TOKEN_EXPIRY_BUFFER_MS > Date.now()
  ) {
    return data.access_token
  }

  larkTokenRefreshInFlight ??= refreshLarkUserAccessToken(
    data.refresh_token
  ).finally(() => {
    larkTokenRefreshInFlight = undefined
  })

  return larkTokenRefreshInFlight
}

export async function createLarkMeeting(input: {
  topic: string
  expiresAt: Date
}) {
  const accessToken = await getLarkUserAccessToken()
  const response = await fetch(LARK_RESERVE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      end_time: Math.floor(input.expiresAt.getTime() / 1000).toString(),
      meeting_settings: {
        topic: input.topic,
        auto_record: false,
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(
      `Lark meeting creation failed with HTTP ${response.status}.`
    )
  }

  const parsed = larkReserveResponseSchema.safeParse(await response.json())

  if (!parsed.success) {
    throw new Error("Lark returned an invalid meeting response.")
  }

  return {
    joinUrl: parsed.data.data.reserve.url,
    providerMeetingId: String(parsed.data.data.reserve.meeting_no),
  }
}

import "server-only"

import { z } from "zod"

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token"
const ZOOM_API_URL = "https://api.zoom.us/v2"
const REQUEST_TIMEOUT_MS = 15_000
const TOKEN_EXPIRY_BUFFER_MS = 60_000

const zoomTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive().default(3600),
})

const zoomMeetingResponseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  join_url: z.url(),
})

let cachedToken:
  | {
      accessToken: string
      expiresAt: number
    }
  | undefined

function requiredZoomEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required Zoom configuration: ${name}.`)
  }

  return value
}

async function getZoomAccessToken() {
  if (
    cachedToken &&
    cachedToken.expiresAt - TOKEN_EXPIRY_BUFFER_MS > Date.now()
  ) {
    return cachedToken.accessToken
  }

  const accountId = requiredZoomEnv("ZOOM_ACCOUNT_ID")
  const clientId = requiredZoomEnv("ZOOM_CLIENT_ID")
  const clientSecret = requiredZoomEnv("ZOOM_CLIENT_SECRET")
  const tokenUrl = new URL(ZOOM_TOKEN_URL)
  tokenUrl.searchParams.set("grant_type", "account_credentials")
  tokenUrl.searchParams.set("account_id", accountId)

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Zoom authentication failed with HTTP ${response.status}.`)
  }

  const parsed = zoomTokenResponseSchema.safeParse(await response.json())

  if (!parsed.success) {
    throw new Error("Zoom returned an invalid authentication response.")
  }

  cachedToken = {
    accessToken: parsed.data.access_token,
    expiresAt: Date.now() + parsed.data.expires_in * 1000,
  }

  return cachedToken.accessToken
}

export async function createZoomMeeting(input: {
  topic: string
  durationMinutes: number
  startsAt: Date
}) {
  const accessToken = await getZoomAccessToken()
  const response = await fetch(`${ZOOM_API_URL}/users/me/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.startsAt.toISOString(),
      duration: input.durationMinutes,
      settings: {
        join_before_host: true,
        waiting_room: false,
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(
      `Zoom meeting creation failed with HTTP ${response.status}.`
    )
  }

  const parsed = zoomMeetingResponseSchema.safeParse(await response.json())

  if (!parsed.success) {
    throw new Error("Zoom returned an invalid meeting response.")
  }

  return {
    joinUrl: parsed.data.join_url,
    providerMeetingId: String(parsed.data.id),
  }
}

export function resetZoomTokenCacheForTests() {
  if (process.env.NODE_ENV === "test") {
    cachedToken = undefined
  }
}

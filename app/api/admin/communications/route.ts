import { NextResponse } from "next/server"
import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"

const communicationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
  target: z.enum(["all", "delegation", "partner", "admin"]),
  channel: z.enum(["email", "notification", "both"]),
  status: z.enum(["Draft", "Queued", "Sent"]).optional(),
})

async function getAdminClient() {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return {
      error: NextResponse.json(
        { error: authorization.error },
        { status: 401 }
      ),
    }
  }

  if (
    authorization.identity.role !== "admin" ||
    !authorization.identity.adminId
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return {
    supabase: authorization.supabase,
    identity: authorization.identity,
  }
}

export async function POST(request: Request) {
  const auth = await getAdminClient()

  if ("error" in auth) {
    return auth.error
  }

  const parsed = communicationSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid communication payload." },
      { status: 400 }
    )
  }

  const status = parsed.data.status ?? "Queued"
  const result = await auth.supabase
    .from("announcements")
    .insert({
      title: parsed.data.title,
      message: parsed.data.message,
      target: parsed.data.target,
      channel: parsed.data.channel,
      status,
      sent_at: status === "Sent" ? new Date().toISOString() : null,
      created_by: "Admin API",
      admin_id: auth.identity.adminId,
    })
    .select("*")
    .single()

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  if (
    parsed.data.channel === "notification" ||
    parsed.data.channel === "both"
  ) {
    await auth.supabase.from("notifications").insert({
      message: `${parsed.data.title}: ${parsed.data.message}`,
      admin_id: auth.identity.adminId,
    })
  }

  return NextResponse.json({ ok: true, announcement: result.data })
}

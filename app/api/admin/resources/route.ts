import { NextResponse } from "next/server"
import { z } from "zod"

import { getAppMetadata } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const resourceSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.enum(["Agenda", "Map", "Briefing", "Logistics", "Other"]),
  fileName: z.string().trim().min(3).max(160),
  fileUrl: z.string().trim().min(1).max(500),
  audience: z.enum(["all", "delegation", "partner", "admin"]),
  visibleToDelegation: z.boolean(),
  notes: z.string().trim().max(1000),
})

const visibilitySchema = z.object({
  id: z.uuid(),
  visibleToDelegation: z.boolean(),
})

async function getAdminClient() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (getAppMetadata(user).role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase }
}

export async function POST(request: Request) {
  const auth = await getAdminClient()

  if ("error" in auth) {
    return auth.error
  }

  const parsed = resourceSchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resource payload." },
      { status: 400 }
    )
  }

  const result = await auth.supabase
    .from("event_resources")
    .insert({
      title: parsed.data.title,
      category: parsed.data.category,
      file_name: parsed.data.fileName,
      file_url: parsed.data.fileUrl,
      audience: parsed.data.audience,
      visible_to_delegation: parsed.data.visibleToDelegation,
      notes: parsed.data.notes,
    })
    .select("*")
    .single()

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, resource: result.data })
}

export async function PATCH(request: Request) {
  const auth = await getAdminClient()

  if ("error" in auth) {
    return auth.error
  }

  const parsed = visibilitySchema.safeParse(
    await request.json().catch(() => null)
  )

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resource visibility payload." },
      { status: 400 }
    )
  }

  const result = await auth.supabase
    .from("event_resources")
    .update({ visible_to_delegation: parsed.data.visibleToDelegation })
    .eq("id", parsed.data.id)
    .select("*")
    .single()

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, resource: result.data })
}

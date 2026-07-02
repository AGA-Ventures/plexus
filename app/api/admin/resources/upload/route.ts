import { NextResponse } from "next/server"
import { z } from "zod"

import { getAppMetadata } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const bucketName = "event-resources"
const maxUploadBytes = 15 * 1024 * 1024
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
])

const uploadSchema = z.object({
  title: z.string().trim().min(3).max(120),
  category: z.enum(["Agenda", "Map", "Briefing", "Logistics", "Other"]),
  audience: z.enum(["all", "delegation", "partner", "admin"]),
  visibleToDelegation: z.boolean(),
  notes: z.string().trim().max(1000),
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

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .trim()
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 140) || "event-resource"
  )
}

export async function POST(request: Request) {
  const auth = await getAdminClient()

  if ("error" in auth) {
    return auth.error
  }

  const formData = await request.formData().catch(() => null)

  if (!formData) {
    return NextResponse.json(
      { error: "Invalid multipart upload payload." },
      { status: 400 }
    )
  }

  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload a file before submitting the resource." },
      { status: 400 }
    )
  }

  if (file.size > maxUploadBytes) {
    return NextResponse.json(
      { error: "File is larger than the 15 MB event material limit." },
      { status: 400 }
    )
  }

  if (file.type && !allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type for event materials." },
      { status: 400 }
    )
  }

  const parsed = uploadSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    audience: formData.get("audience"),
    visibleToDelegation: formData.get("visibleToDelegation") === "true",
    notes: formData.get("notes") ?? "",
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid resource upload metadata." },
      { status: 400 }
    )
  }

  const resourceId = crypto.randomUUID()
  const safeName = sanitizeFileName(file.name)
  const storagePath = `materials/${resourceId}-${safeName}`
  const fileUrl = `/api/resources/${resourceId}/file`

  const uploadResult = await auth.supabase.storage
    .from(bucketName)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  if (uploadResult.error) {
    return NextResponse.json(
      { error: uploadResult.error.message },
      { status: 500 }
    )
  }

  const insertResult = await auth.supabase
    .from("event_resources")
    .insert({
      id: resourceId,
      title: parsed.data.title,
      category: parsed.data.category,
      file_name: safeName,
      file_url: fileUrl,
      storage_path: storagePath,
      audience: parsed.data.audience,
      visible_to_delegation: parsed.data.visibleToDelegation,
      notes: parsed.data.notes,
    })
    .select("*")
    .single()

  if (insertResult.error) {
    await auth.supabase.storage.from(bucketName).remove([storagePath])

    return NextResponse.json(
      { error: insertResult.error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, resource: insertResult.data })
}

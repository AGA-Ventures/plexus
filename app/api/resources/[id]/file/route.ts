import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { createSupabaseServerClient } from "@/lib/supabase/server"

const bucketName = "event-resources"

type ResourceFileRow = {
  file_url: string
  storage_path: string | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = z.uuid().safeParse(id)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resource id." }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await supabase
    .from("event_resources")
    .select("file_url, storage_path")
    .eq("id", parsed.data)
    .single<ResourceFileRow>()

  if (result.error || !result.data) {
    return NextResponse.json({ error: "Resource not found." }, { status: 404 })
  }

  if (!result.data.storage_path) {
    return NextResponse.redirect(new URL(result.data.file_url, _request.url))
  }

  const signedUrl = await supabase.storage
    .from(bucketName)
    .createSignedUrl(result.data.storage_path, 60)

  if (signedUrl.error || !signedUrl.data?.signedUrl) {
    return NextResponse.json(
      { error: signedUrl.error?.message ?? "Unable to open resource file." },
      { status: 500 }
    )
  }

  return NextResponse.redirect(signedUrl.data.signedUrl)
}

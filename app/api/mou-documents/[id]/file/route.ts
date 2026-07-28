import { NextResponse } from "next/server"
import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import { mouDocumentsBucket } from "@/lib/mou-documents"

const documentIdSchema = z.uuid()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: 401 })
  }

  if (!["admin", "vendor"].includes(authorization.identity.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const params = await context.params
  const idResult = documentIdSchema.safeParse(params.id)

  if (!idResult.success) {
    return NextResponse.json(
      { error: "The MOU document was not found." },
      { status: 404 }
    )
  }

  const documentResult = await authorization.supabase
    .from("mou_documents")
    .select("storage_path")
    .eq("id", idResult.data)
    .maybeSingle()

  if (documentResult.error || !documentResult.data) {
    return NextResponse.json(
      { error: "The MOU document was not found." },
      { status: 404 }
    )
  }

  const signedUrlResult = await authorization.supabase.storage
    .from(mouDocumentsBucket)
    .createSignedUrl(documentResult.data.storage_path, 60)

  if (signedUrlResult.error || !signedUrlResult.data.signedUrl) {
    return NextResponse.json(
      { error: "The private MOU PDF could not be opened." },
      { status: 500 }
    )
  }

  return NextResponse.redirect(signedUrlResult.data.signedUrl, {
    status: 303,
    headers: {
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "private, no-store",
    },
  })
}

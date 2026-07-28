import { NextResponse } from "next/server"
import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import {
  getMouDocumentStoragePath,
  isMouPdfSignature,
  maxMouDocumentBytes,
  mouDocumentMimeType,
  mouDocumentsBucket,
  sanitizeMouDocumentName,
  toMouDocument,
  type MouDocumentRow,
} from "@/lib/mou-documents"

const dealIdSchema = z.uuid()

async function getAdminDeal(dealId: string): Promise<
  | {
      ok: true
      authorization: Awaited<ReturnType<typeof getAuthenticatedIdentity>> & {
        ok: true
      }
    }
  | { ok: false; response: NextResponse }
> {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: authorization.error },
        { status: 401 }
      ),
    }
  }

  if (
    authorization.identity.role !== "admin" ||
    !authorization.identity.adminId
  ) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  const dealResult = await authorization.supabase
    .from("deals")
    .select("id")
    .eq("id", dealId)
    .eq("admin_id", authorization.identity.adminId)
    .maybeSingle()

  if (dealResult.error || !dealResult.data) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "The MOU record was not found." },
        { status: 404 }
      ),
    }
  }

  return { ok: true, authorization }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const idResult = dealIdSchema.safeParse(params.id)

  if (!idResult.success) {
    return NextResponse.json(
      { error: "The MOU record was not found." },
      { status: 404 }
    )
  }

  const access = await getAdminDeal(idResult.data)

  if (!access.ok) {
    return access.response
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose a draft or signed MOU PDF to upload." },
      { status: 400 }
    )
  }

  if (
    !file.name.toLowerCase().endsWith(".pdf") ||
    (file.type && file.type !== mouDocumentMimeType)
  ) {
    return NextResponse.json(
      { error: "Only PDF documents can be uploaded." },
      { status: 400 }
    )
  }

  if (file.size > maxMouDocumentBytes) {
    return NextResponse.json(
      { error: "MOU PDFs must be 10 MB or smaller." },
      { status: 400 }
    )
  }

  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer())

  if (!isMouPdfSignature(signature)) {
    return NextResponse.json(
      { error: "The selected file is not a valid PDF document." },
      { status: 400 }
    )
  }

  const { identity, supabase } = access.authorization
  const adminId = identity.adminId!
  const dealId = idResult.data
  const fileName = sanitizeMouDocumentName(file.name)
  const uploadId = crypto.randomUUID()
  const storagePath = getMouDocumentStoragePath({
    adminId,
    dealId,
    uploadId,
    fileName,
  })
  const existingResult = await supabase
    .from("mou_documents")
    .select("id, storage_path")
    .eq("deal_id", dealId)
    .maybeSingle()

  if (existingResult.error) {
    return NextResponse.json(
      { error: "The current MOU document could not be checked." },
      { status: 500 }
    )
  }

  const uploadResult = await supabase.storage
    .from(mouDocumentsBucket)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: mouDocumentMimeType,
      upsert: false,
    })

  if (uploadResult.error) {
    console.warn("MOU document upload failed.", {
      name: uploadResult.error.name,
    })
    return NextResponse.json(
      { error: "The MOU PDF could not be uploaded. Please try again." },
      { status: 500 }
    )
  }

  const metadata = {
    admin_id: adminId,
    uploaded_by: identity.userId,
    file_name: fileName,
    storage_path: storagePath,
    mime_type: mouDocumentMimeType,
    file_size: file.size,
  }
  const metadataResult = existingResult.data
    ? await supabase
        .from("mou_documents")
        .update(metadata)
        .eq("id", existingResult.data.id)
        .select("id, deal_id, file_name, file_size, updated_at")
        .single()
    : await supabase
        .from("mou_documents")
        .insert({
          ...metadata,
          deal_id: dealId,
        })
        .select("id, deal_id, file_name, file_size, updated_at")
        .single()

  if (metadataResult.error) {
    await supabase.storage.from(mouDocumentsBucket).remove([storagePath])

    return NextResponse.json(
      { error: "The MOU PDF metadata could not be saved." },
      { status: 500 }
    )
  }

  if (existingResult.data?.storage_path) {
    const removeResult = await supabase.storage
      .from(mouDocumentsBucket)
      .remove([existingResult.data.storage_path])

    if (removeResult.error) {
      console.warn("Superseded MOU file cleanup failed.", {
        name: removeResult.error.name,
      })
    }
  }

  return NextResponse.json(
    {
      document: toMouDocument(metadataResult.data as MouDocumentRow),
    },
    { status: existingResult.data ? 200 : 201 }
  )
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const idResult = dealIdSchema.safeParse(params.id)

  if (!idResult.success) {
    return NextResponse.json(
      { error: "The MOU record was not found." },
      { status: 404 }
    )
  }

  const access = await getAdminDeal(idResult.data)

  if (!access.ok) {
    return access.response
  }

  const { supabase } = access.authorization
  const documentResult = await supabase
    .from("mou_documents")
    .select("id, storage_path")
    .eq("deal_id", idResult.data)
    .maybeSingle()

  if (documentResult.error || !documentResult.data) {
    return NextResponse.json(
      { error: "No uploaded PDF is attached to this MOU." },
      { status: 404 }
    )
  }

  const deleteResult = await supabase
    .from("mou_documents")
    .delete()
    .eq("id", documentResult.data.id)

  if (deleteResult.error) {
    return NextResponse.json(
      { error: "The MOU document record could not be deleted." },
      { status: 500 }
    )
  }

  const removeResult = await supabase.storage
    .from(mouDocumentsBucket)
    .remove([documentResult.data.storage_path])

  if (removeResult.error) {
    console.warn("Deleted MOU metadata left an orphaned private object.", {
      name: removeResult.error.name,
    })
  }

  return NextResponse.json({ ok: true })
}

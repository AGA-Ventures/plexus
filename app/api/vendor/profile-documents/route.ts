import { NextResponse } from "next/server"
import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import {
  getVendorProfileDocumentStoragePath,
  isPdfSignature,
  maxVendorProfileDocumentBytes,
  sanitizeVendorProfileDocumentName,
  toVendorProfileDocument,
  vendorProfileDocumentMimeType,
  vendorProfileDocumentsBucket,
  type VendorProfileDocumentRow,
} from "@/lib/vendor-profile-documents"

const deleteSchema = z.object({
  id: z.uuid(),
})

async function getVendorClient() {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return {
      error: NextResponse.json(
        { error: authorization.error },
        { status: 401 }
      ),
    }
  }

  const { identity } = authorization

  if (
    identity.role !== "vendor" ||
    !identity.adminId ||
    !identity.vendorCompanyId ||
    !identity.vendorType
  ) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return authorization
}

export async function GET() {
  const authorization = await getVendorClient()

  if ("error" in authorization) {
    return authorization.error
  }

  const result = await authorization.supabase
    .from("vendor_profile_documents")
    .select("id, file_name, file_size, created_at")
    .order("created_at", { ascending: false })

  if (result.error) {
    return NextResponse.json(
      { error: "Profile documents could not be loaded." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    documents: (result.data as VendorProfileDocumentRow[]).map(
      toVendorProfileDocument
    ),
  })
}

export async function POST(request: Request) {
  const authorization = await getVendorClient()

  if ("error" in authorization) {
    return authorization.error
  }

  const formData = await request.formData().catch(() => null)
  const file = formData?.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose a PDF document to upload." },
      { status: 400 }
    )
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF documents can be uploaded." },
      { status: 400 }
    )
  }

  if (file.type && file.type !== vendorProfileDocumentMimeType) {
    return NextResponse.json(
      { error: "Only PDF documents can be uploaded." },
      { status: 400 }
    )
  }

  if (file.size > maxVendorProfileDocumentBytes) {
    return NextResponse.json(
      { error: "PDF documents must be 6 MB or smaller." },
      { status: 400 }
    )
  }

  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer())

  if (!isPdfSignature(signature)) {
    return NextResponse.json(
      { error: "The selected file is not a valid PDF document." },
      { status: 400 }
    )
  }

  const { identity, supabase } = authorization
  const adminId = identity.adminId!
  const vendorCompanyId = identity.vendorCompanyId!
  const documentId = crypto.randomUUID()
  const fileName = sanitizeVendorProfileDocumentName(file.name)
  const storagePath = getVendorProfileDocumentStoragePath({
    adminId,
    vendorCompanyId,
    documentId,
    fileName,
  })
  const uploadResult = await supabase.storage
    .from(vendorProfileDocumentsBucket)
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: vendorProfileDocumentMimeType,
      upsert: false,
    })

  if (uploadResult.error) {
    console.warn("Vendor profile document upload failed.", {
      name: uploadResult.error.name,
    })
    return NextResponse.json(
      { error: "The PDF could not be uploaded. Please try again." },
      { status: 500 }
    )
  }

  const insertResult = await supabase
    .from("vendor_profile_documents")
    .insert({
      id: documentId,
      admin_id: adminId,
      vendor_company_id: vendorCompanyId,
      vendor_type: identity.vendorType,
      uploaded_by: identity.userId,
      file_name: fileName,
      storage_path: storagePath,
      mime_type: vendorProfileDocumentMimeType,
      file_size: file.size,
    })
    .select("id, file_name, file_size, created_at")
    .single()

  if (insertResult.error) {
    await supabase.storage
      .from(vendorProfileDocumentsBucket)
      .remove([storagePath])

    return NextResponse.json(
      { error: "The PDF metadata could not be saved." },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      document: toVendorProfileDocument(
        insertResult.data as VendorProfileDocumentRow
      ),
    },
    { status: 201 }
  )
}

export async function DELETE(request: Request) {
  const authorization = await getVendorClient()

  if ("error" in authorization) {
    return authorization.error
  }

  const body = await request.json().catch(() => null)
  const parsed = deleteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Select a valid profile document." },
      { status: 400 }
    )
  }

  const { supabase } = authorization
  const documentResult = await supabase
    .from("vendor_profile_documents")
    .select("id, storage_path")
    .eq("id", parsed.data.id)
    .maybeSingle()

  if (documentResult.error || !documentResult.data) {
    return NextResponse.json(
      { error: "The profile document was not found." },
      { status: 404 }
    )
  }

  const removeResult = await supabase.storage
    .from(vendorProfileDocumentsBucket)
    .remove([documentResult.data.storage_path])

  if (removeResult.error) {
    return NextResponse.json(
      { error: "The PDF could not be removed from private storage." },
      { status: 500 }
    )
  }

  const deleteResult = await supabase
    .from("vendor_profile_documents")
    .delete()
    .eq("id", parsed.data.id)

  if (deleteResult.error) {
    return NextResponse.json(
      { error: "The profile document record could not be deleted." },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { z } from "zod"

import { getAuthenticatedIdentity } from "@/lib/authorization"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import {
  detectTenantLogoMimeType,
  getOwnedTenantLogoStoragePath,
  getTenantLogoStoragePath,
  maxTenantLogoBytes,
  tenantBrandingBucket,
} from "@/lib/tenant-logo-upload"

const tenantIdSchema = z.uuid()

export async function POST(request: Request) {
  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    return NextResponse.json({ error: authorization.error }, { status: 401 })
  }

  const { identity, supabase } = authorization

  if (!["superadmin", "admin"].includes(identity.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await request.formData().catch(() => null)

  if (!formData) {
    return NextResponse.json(
      { error: "Invalid multipart upload payload." },
      { status: 400 }
    )
  }

  const tenantIdResult = tenantIdSchema.safeParse(formData.get("tenantId"))
  const file = formData.get("file")

  if (!tenantIdResult.success) {
    return NextResponse.json(
      { error: "Select a valid Admin tenant." },
      { status: 400 }
    )
  }

  const tenantId = tenantIdResult.data

  if (identity.role === "admin" && identity.adminId !== tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose a PNG, JPEG, or WebP logo." },
      { status: 400 }
    )
  }

  if (file.size > maxTenantLogoBytes) {
    return NextResponse.json(
      { error: "Logo images must be 2 MB or smaller." },
      { status: 400 }
    )
  }

  const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const mimeType = detectTenantLogoMimeType(signature)

  if (!mimeType) {
    return NextResponse.json(
      { error: "Choose a valid PNG, JPEG, or WebP image." },
      { status: 400 }
    )
  }

  const tenantResult = await supabase
    .from("admin_tenants")
    .select("id, logo_url")
    .eq("id", tenantId)
    .maybeSingle()

  if (tenantResult.error || !tenantResult.data) {
    return NextResponse.json(
      { error: "The Admin tenant could not be verified." },
      { status: 404 }
    )
  }

  try {
    const adminClient = createSupabaseAdminClient()
    const storagePath = getTenantLogoStoragePath({
      tenantId,
      mimeType,
      objectId: crypto.randomUUID(),
    })
    const uploadResult = await adminClient.storage
      .from(tenantBrandingBucket)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: mimeType,
        upsert: false,
      })

    if (uploadResult.error) {
      console.warn("Supabase tenant logo upload failed.", {
        name: uploadResult.error.name,
      })
      return NextResponse.json(
        {
          error:
            "The logo could not be uploaded. Check the branding storage configuration.",
        },
        { status: 500 }
      )
    }

    const publicUrl = adminClient.storage
      .from(tenantBrandingBucket)
      .getPublicUrl(storagePath).data.publicUrl
    const updateResult = await supabase
      .from("admin_tenants")
      .update({ logo_url: publicUrl })
      .eq("id", tenantId)
      .select("id")
      .single()

    if (updateResult.error) {
      await adminClient.storage.from(tenantBrandingBucket).remove([storagePath])

      return NextResponse.json(
        { error: "The uploaded logo could not be saved to the tenant." },
        { status: 500 }
      )
    }

    const previousStoragePath = getOwnedTenantLogoStoragePath(
      tenantResult.data.logo_url,
      tenantId
    )

    if (previousStoragePath && previousStoragePath !== storagePath) {
      const cleanupResult = await adminClient.storage
        .from(tenantBrandingBucket)
        .remove([previousStoragePath])

      if (cleanupResult.error) {
        console.warn("Previous tenant logo cleanup failed.", {
          name: cleanupResult.error.name,
        })
      }
    }

    return NextResponse.json({ ok: true, logoUrl: publicUrl })
  } catch {
    return NextResponse.json(
      {
        error:
          "The logo could not be uploaded. Check the server branding configuration.",
      },
      { status: 500 }
    )
  }
}

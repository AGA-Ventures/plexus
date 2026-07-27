import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { z } from "zod"

import { LoginForm } from "@/components/login-form"
import { getRolePortalPath } from "@/lib/auth"
import { getAuthenticatedIdentity } from "@/lib/authorization"
import { isLocaleParam, normalizeLocale } from "@/lib/i18n"
import {
  getTenantLoginBranding,
  type TenantBrandingRow,
} from "@/lib/login-branding"

export const metadata: Metadata = {
  title: "Tenant login preview · Plexus",
}

export default async function TenantLoginPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ tenantId?: string | string[] }>
}) {
  const { locale } = await params
  const { tenantId } = await searchParams

  if (!isLocaleParam(locale)) {
    notFound()
  }

  const normalizedLocale = normalizeLocale(locale)
  const parsedTenantId = z
    .uuid()
    .safeParse(Array.isArray(tenantId) ? tenantId[0] : tenantId)

  if (!parsedTenantId.success) {
    notFound()
  }

  const authorization = await getAuthenticatedIdentity()

  if (!authorization.ok) {
    redirect(
      `/${normalizedLocale}/login?next=${encodeURIComponent(`/${normalizedLocale}/login-preview?tenantId=${parsedTenantId.data}`)}`
    )
  }

  const { identity, supabase } = authorization

  if (!["superadmin", "admin"].includes(identity.role)) {
    redirect(getRolePortalPath(normalizedLocale, identity.role))
  }

  if (identity.role === "admin" && identity.adminId !== parsedTenantId.data) {
    redirect(getRolePortalPath(normalizedLocale, identity.role))
  }

  const tenantResult = await supabase
    .from("admin_tenants")
    .select("slug, name, support_email, logo_url, primary_color")
    .eq("id", parsedTenantId.data)
    .maybeSingle()

  if (tenantResult.error || !tenantResult.data) {
    notFound()
  }

  return (
    <LoginForm
      locale={normalizedLocale}
      branding={getTenantLoginBranding(tenantResult.data as TenantBrandingRow)}
      previewMode
    />
  )
}

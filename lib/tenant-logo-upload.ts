export const tenantBrandingBucket = "tenant-branding"
export const maxTenantLogoBytes = 2 * 1024 * 1024

export const tenantLogoMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export type TenantLogoMimeType = (typeof tenantLogoMimeTypes)[number]

const fileExtensionByMimeType: Record<TenantLogoMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function detectTenantLogoMimeType(
  bytes: Uint8Array
): TenantLogoMimeType | undefined {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png"
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg"
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp"
  }

  return undefined
}

export function getTenantLogoStoragePath({
  tenantId,
  mimeType,
  objectId,
}: {
  tenantId: string
  mimeType: TenantLogoMimeType
  objectId: string
}) {
  return `${tenantId}/login-logo-${objectId}.${fileExtensionByMimeType[mimeType]}`
}

export function getOwnedTenantLogoStoragePath(
  logoUrl: string,
  tenantId: string
) {
  const marker = `/storage/v1/object/public/${tenantBrandingBucket}/`

  try {
    const url = new URL(logoUrl)
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return undefined
    }

    const storagePath = decodeURIComponent(
      url.pathname.slice(markerIndex + marker.length)
    )

    return storagePath.startsWith(`${tenantId}/`) ? storagePath : undefined
  } catch {
    return undefined
  }
}

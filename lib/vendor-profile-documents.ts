export const vendorProfileDocumentsBucket = "vendor-profile-documents"
export const maxVendorProfileDocumentBytes = 6 * 1024 * 1024
export const vendorProfileDocumentMimeType = "application/pdf"

export type VendorProfileDocument = {
  id: string
  fileName: string
  fileSize: number
  createdAt: string
  reviewUrl: string
}

export type VendorProfileDocumentRow = {
  id: string
  file_name: string
  file_size: number
  created_at: string
}

export function isPdfSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
}

export function sanitizeVendorProfileDocumentName(fileName: string) {
  const withoutExtension = fileName.trim().replace(/\.pdf$/i, "")
  const safeBase =
    withoutExtension
      .normalize("NFKC")
      .trim()
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/\.{2,}/g, ".")
      .replace(/[-_.]{2,}/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 120) || "vendor-document"

  return `${safeBase}.pdf`
}

export function getVendorProfileDocumentStoragePath({
  adminId,
  vendorCompanyId,
  documentId,
  fileName,
}: {
  adminId: string
  vendorCompanyId: string
  documentId: string
  fileName: string
}) {
  return `${adminId}/${vendorCompanyId}/${documentId}-${sanitizeVendorProfileDocumentName(fileName)}`
}

export function toVendorProfileDocument(
  row: VendorProfileDocumentRow
): VendorProfileDocument {
  return {
    id: row.id,
    fileName: row.file_name,
    fileSize: Number(row.file_size),
    createdAt: row.created_at,
    reviewUrl: `/api/vendor/profile-documents/${row.id}/file`,
  }
}

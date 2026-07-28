export const mouDocumentsBucket = "mou-documents"
export const maxMouDocumentBytes = 10 * 1024 * 1024
export const mouDocumentMimeType = "application/pdf"

export type MouDocument = {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: string
  reviewUrl: string
}

export type MouDocumentRow = {
  id: string
  deal_id: string
  file_name: string
  file_size: number
  updated_at: string
}

export function isMouPdfSignature(bytes: Uint8Array) {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  )
}

export function sanitizeMouDocumentName(fileName: string) {
  const withoutExtension = fileName.trim().replace(/\.pdf$/i, "")
  const safeBase =
    withoutExtension
      .normalize("NFKC")
      .trim()
      .replace(/[^\p{L}\p{N}._-]+/gu, "-")
      .replace(/\.{2,}/g, ".")
      .replace(/[-_.]{2,}/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .slice(0, 120) || "mou-agreement"

  return `${safeBase}.pdf`
}

export function getMouDocumentStoragePath({
  adminId,
  dealId,
  uploadId,
  fileName,
}: {
  adminId: string
  dealId: string
  uploadId: string
  fileName: string
}) {
  return `${adminId}/${dealId}/${uploadId}-${sanitizeMouDocumentName(fileName)}`
}

export function toMouDocument(row: MouDocumentRow): MouDocument {
  return {
    id: row.id,
    fileName: row.file_name,
    fileSize: Number(row.file_size),
    uploadedAt: row.updated_at,
    reviewUrl: `/api/mou-documents/${row.id}/file`,
  }
}

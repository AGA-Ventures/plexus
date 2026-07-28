import { describe, expect, it } from "vitest"

import {
  getVendorProfileDocumentStoragePath,
  isPdfSignature,
  maxVendorProfileDocumentBytes,
  sanitizeVendorProfileDocumentName,
  toVendorProfileDocument,
} from "@/lib/vendor-profile-documents"

const adminId = "7aa8562e-f281-4138-a830-3e6bcc57b0b9"
const vendorCompanyId = "d7322a2c-ad23-4a6c-8100-8ad4b055f87f"
const documentId = "eb25d8c5-a6a4-4613-afba-3de36dc6ac79"

describe("Vendor profile documents", () => {
  it("recognizes the PDF file signature", () => {
    expect(isPdfSignature(new TextEncoder().encode("%PDF-1.7"))).toBe(true)
    expect(isPdfSignature(new TextEncoder().encode("<script>"))).toBe(false)
    expect(isPdfSignature(new Uint8Array())).toBe(false)
  })

  it("sanitizes file names while retaining a PDF extension", () => {
    expect(
      sanitizeVendorProfileDocumentName(" Company Profile / 2026.PDF ")
    ).toBe("Company-Profile-2026.pdf")
    expect(sanitizeVendorProfileDocumentName("../../.pdf")).toBe(
      "vendor-document.pdf"
    )
    expect(sanitizeVendorProfileDocumentName("公司簡介.pdf")).toBe(
      "公司簡介.pdf"
    )
  })

  it("creates tenant and company scoped private object paths", () => {
    expect(
      getVendorProfileDocumentStoragePath({
        adminId,
        vendorCompanyId,
        documentId,
        fileName: "Company Profile.pdf",
      })
    ).toBe(
      `${adminId}/${vendorCompanyId}/${documentId}-Company-Profile.pdf`
    )
  })

  it("maps only safe metadata and the protected review route to the client", () => {
    expect(
      toVendorProfileDocument({
        id: documentId,
        file_name: "Company-Profile.pdf",
        file_size: maxVendorProfileDocumentBytes,
        created_at: "2026-07-28T00:00:00.000Z",
      })
    ).toEqual({
      id: documentId,
      fileName: "Company-Profile.pdf",
      fileSize: maxVendorProfileDocumentBytes,
      createdAt: "2026-07-28T00:00:00.000Z",
      reviewUrl: `/api/vendor/profile-documents/${documentId}/file`,
    })
  })
})

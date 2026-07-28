import { describe, expect, it } from "vitest"

import {
  getMouDocumentStoragePath,
  isMouPdfSignature,
  maxMouDocumentBytes,
  mouDocumentMimeType,
  sanitizeMouDocumentName,
  toMouDocument,
} from "@/lib/mou-documents"

describe("MOU document helpers", () => {
  it("accepts the PDF file signature and rejects renamed non-PDF bytes", () => {
    expect(
      isMouPdfSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))
    ).toBe(true)
    expect(
      isMouPdfSignature(new Uint8Array([0x50, 0x4e, 0x47, 0x0d, 0x0a]))
    ).toBe(false)
  })

  it("normalizes unsafe names while preserving a PDF extension", () => {
    expect(sanitizeMouDocumentName("../../Draft MOU (final).PDF")).toBe(
      "Draft-MOU-final.pdf"
    )
    expect(sanitizeMouDocumentName("...pdf")).toBe("mou-agreement.pdf")
  })

  it("builds a tenant and deal scoped private object path", () => {
    expect(
      getMouDocumentStoragePath({
        adminId: "11111111-1111-4111-8111-111111111111",
        dealId: "22222222-2222-4222-8222-222222222222",
        uploadId: "33333333-3333-4333-8333-333333333333",
        fileName: "Signed MOU.pdf",
      })
    ).toBe(
      "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/33333333-3333-4333-8333-333333333333-Signed-MOU.pdf"
    )
  })

  it("returns only safe client metadata and a protected review route", () => {
    expect(
      toMouDocument({
        id: "44444444-4444-4444-8444-444444444444",
        deal_id: "55555555-5555-4555-8555-555555555555",
        file_name: "agreement.pdf",
        file_size: 2048,
        updated_at: "2026-07-28T00:00:00.000Z",
      })
    ).toEqual({
      id: "44444444-4444-4444-8444-444444444444",
      fileName: "agreement.pdf",
      fileSize: 2048,
      uploadedAt: "2026-07-28T00:00:00.000Z",
      reviewUrl: "/api/mou-documents/44444444-4444-4444-8444-444444444444/file",
    })
  })

  it("keeps the server and bucket constraints aligned", () => {
    expect(maxMouDocumentBytes).toBe(10 * 1024 * 1024)
    expect(mouDocumentMimeType).toBe("application/pdf")
  })
})

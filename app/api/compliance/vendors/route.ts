import {
  getComplianceVendorStatus,
  requireComplianceAdmin,
} from "@/lib/compliance"

export async function GET() {
  const auth = await requireComplianceAdmin()

  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  return Response.json({ vendors: getComplianceVendorStatus() })
}

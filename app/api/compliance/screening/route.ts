import {
  complianceScreeningInputSchema,
  requireComplianceAdmin,
  runComplianceScreening,
} from "@/lib/compliance"

export async function POST(request: Request) {
  const auth = await requireComplianceAdmin()

  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const parsed = complianceScreeningInputSchema.safeParse(await request.json())

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid compliance screening payload.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }

  return Response.json({ result: await runComplianceScreening(parsed.data) })
}

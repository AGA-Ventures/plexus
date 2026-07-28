import { z } from "zod"

const uuidSchema = z.uuid()

export const manualMeetingInputSchema = z.object({
  delegationId: uuidSchema,
  partnerId: uuidSchema,
  platform: z.enum(["zoom", "lark"]),
  startsAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(480),
  requestedInterpreterId: z.union([uuidSchema, z.null()]).default(null),
  agenda: z.string().trim().min(3).max(1000),
})

export type ManualMeetingInput = z.infer<typeof manualMeetingInputSchema>

export const meetingAmendmentInputSchema = z.object({
  meetingId: uuidSchema,
  platform: z.enum(["zoom", "lark"]),
  startsAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(480),
  requestedInterpreterId: z.union([uuidSchema, z.null()]).default(null),
  agenda: z.string().trim().min(3).max(1000),
})

export type MeetingAmendmentInput = z.infer<typeof meetingAmendmentInputSchema>

function validateMeetingDate(
  startsAt: string,
  now: Date
):
  | { success: true }
  | {
      success: false
      error: string
    } {
  const meetingDate = new Date(startsAt)
  const latestAllowed = new Date(now)
  latestAllowed.setFullYear(latestAllowed.getFullYear() + 2)

  if (meetingDate.getTime() <= now.getTime()) {
    return { success: false, error: "Choose a future meeting time." }
  }

  if (meetingDate.getTime() > latestAllowed.getTime()) {
    return {
      success: false,
      error: "Meeting dates can be scheduled up to two years ahead.",
    }
  }

  return { success: true }
}

export function validateManualMeetingInput(
  input: unknown,
  now = new Date()
):
  | { success: true; data: ManualMeetingInput }
  | { success: false; error: string } {
  const parsed = manualMeetingInputSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error:
        "Complete the Vendor, platform, schedule, duration, and agenda fields.",
    }
  }

  const dateResult = validateMeetingDate(parsed.data.startsAt, now)

  if (!dateResult.success) {
    return dateResult
  }

  return { success: true, data: parsed.data }
}

export function validateMeetingAmendmentInput(
  input: unknown,
  now = new Date()
):
  | { success: true; data: MeetingAmendmentInput }
  | { success: false; error: string } {
  const parsed = meetingAmendmentInputSchema.safeParse(input)

  if (!parsed.success) {
    return {
      success: false,
      error:
        "Complete the platform, schedule, duration, interpreter, and agenda fields.",
    }
  }

  const dateResult = validateMeetingDate(parsed.data.startsAt, now)

  if (!dateResult.success) {
    return dateResult
  }

  return { success: true, data: parsed.data }
}

export function extractMeetingAgenda(summary: string) {
  const agenda = summary.match(
    /Agenda:\s*(.*?)(?=\s+(?:The accepted match|The calendar slot|Protected provider link|$))/i
  )?.[1]

  return agenda?.trim() ?? ""
}

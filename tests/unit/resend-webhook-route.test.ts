import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  lookup: vi.fn(),
  insertEvent: vi.fn(),
  updateDelivery: vi.fn(),
  updateDeliveryEq: vi.fn(),
}))

vi.mock("resend", () => ({
  Resend: class {
    webhooks = {
      verify: mocks.verify,
    }
  },
}))

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "email_delivery_events") {
        return {
          insert: mocks.insertEvent,
        }
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: mocks.lookup,
          }),
        }),
        update: (values: unknown) => {
          mocks.updateDelivery(values)
          return {
            eq: mocks.updateDeliveryEq,
          }
        },
      }
    },
  }),
}))

import { POST } from "@/app/api/webhooks/resend/route"

function webhookRequest() {
  return new Request("https://plexus.example/api/webhooks/resend", {
    method: "POST",
    headers: {
      "svix-id": "evt_123",
      "svix-timestamp": "1785380400",
      "svix-signature": "v1,test",
    },
    body: "{}",
  })
}

describe("POST /api/webhooks/resend", () => {
  beforeEach(() => {
    vi.stubEnv("RESEND_WEBHOOK_SECRET", "whsec_test")
    mocks.verify.mockReset()
    mocks.lookup.mockReset()
    mocks.insertEvent.mockReset()
    mocks.updateDelivery.mockReset()
    mocks.updateDeliveryEq.mockReset()
    mocks.lookup.mockResolvedValue({
      data: { id: "85000000-0000-4000-8000-000000000001" },
      error: null,
    })
    mocks.insertEvent.mockResolvedValue({ error: null })
    mocks.updateDeliveryEq.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("fails closed when webhook verification is not configured", async () => {
    vi.stubEnv("RESEND_WEBHOOK_SECRET", "")

    const response = await POST(webhookRequest())

    expect(response.status).toBe(503)
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it("rejects an invalid provider timestamp before storing an event", async () => {
    mocks.verify.mockReturnValue({
      type: "email.delivered",
      created_at: "not-a-date",
      data: { email_id: "email_123" },
    })

    const response = await POST(webhookRequest())

    expect(response.status).toBe(400)
    expect(mocks.insertEvent).not.toHaveBeenCalled()
    expect(mocks.updateDelivery).not.toHaveBeenCalled()
  })

  it("advances the delivery even when Resend retries a stored event", async () => {
    mocks.verify.mockReturnValue({
      type: "email.delivered",
      created_at: "2026-07-30T06:20:00.000Z",
      data: { email_id: "email_123" },
    })
    mocks.insertEvent.mockResolvedValue({ error: { code: "23505" } })

    const response = await POST(webhookRequest())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true, matched: true, duplicate: true })
    expect(mocks.updateDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "delivered",
        delivered_at: "2026-07-30T06:20:00.000Z",
      })
    )
  })
})

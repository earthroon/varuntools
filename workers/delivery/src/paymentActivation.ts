import { createPurchaseGrantOnce, insertWebhookEventReceived, type DeliveryDatabase } from './db'
import { retrieveTossPaymentSafe } from './toss'
import type { DeliveryEnv } from './types'

export interface ActivateWebhookInput {
  rawJson: string
  requestId?: string
}

export async function activateTossPaymentWebhook(rawJson: string, env: DeliveryEnv, db: DeliveryDatabase): Promise<Response> {
  const body = JSON.parse(rawJson) as { eventId?: string; eventType?: string; paymentKey?: string; data?: { paymentKey?: string } }
  const paymentKey = body.paymentKey ?? body.data?.paymentKey

  if (!paymentKey) {
    return Response.json({ ok: false, code: 'WEBHOOK_PAYMENT_KEY_MISSING' }, { status: 400 })
  }

  const eventId = body.eventId ?? `payment:${paymentKey}`
  const inserted = await insertWebhookEventReceived(db, {
    eventId,
    paymentKey,
    eventType: body.eventType,
    rawJson,
  })

  if (!inserted) {
    return Response.json({ ok: true, duplicate: true })
  }

  const payment = await retrieveTossPaymentSafe(env, paymentKey)
  const grantId = await createPurchaseGrantOnce(db, payment)
  return Response.json({ ok: true, grantId })
}

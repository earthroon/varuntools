import type { DeliveryEnv, TossPaymentSnapshot } from './types'

export async function retrieveTossPaymentSafe(env: DeliveryEnv, paymentKey: string): Promise<TossPaymentSnapshot> {
  if (!env.TOSS_SECRET_KEY) {
    return { paymentKey, status: 'UNKNOWN' }
  }

  const endpoint = `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`
  const authorization = `Basic ${btoa(`${env.TOSS_SECRET_KEY}:`)}`
  const response = await fetch(endpoint, {
    headers: { authorization },
  })

  if (!response.ok) {
    return { paymentKey, status: 'UNAVAILABLE' }
  }

  const body = await response.json() as Partial<TossPaymentSnapshot>
  return {
    paymentKey: String(body.paymentKey ?? paymentKey),
    orderId: body.orderId,
    status: body.status,
    totalAmount: body.totalAmount,
    approvedAt: body.approvedAt,
  }
}

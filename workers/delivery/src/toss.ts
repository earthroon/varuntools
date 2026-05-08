import { paymentRetrieveConfigured } from './env'
import type { Env, TossPayment, TossRetrieveResult } from './types'

export function tossRetrieveConfigured(env: Env): boolean {
  return paymentRetrieveConfigured(env)
}

export async function retrieveTossPayment(env: Env, paymentKey: string): Promise<TossPayment> {
  const result = await retrieveTossPaymentSafe(env, paymentKey)
  if (!result.ok) throw new Error(result.code)
  return result.payment
}

export async function retrieveTossPaymentSafe(env: Env, paymentKey: string): Promise<TossRetrieveResult> {
  if (!paymentRetrieveConfigured(env)) {
    return {
      ok: false,
      status: 501,
      code: 'PAYMENT_RETRIEVE_NOT_CONFIGURED',
      message: 'Toss retrieve API is not configured for not_configured/test/live mode.',
    }
  }

  const auth = btoa(`${env.TOSS_SECRET_KEY}:`)
  let response: Response
  try {
    response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    })
  } catch (err) {
    return {
      ok: false,
      status: 502,
      code: 'PAYMENT_RETRIEVE_FAILED',
      message: err instanceof Error ? err.message : 'Toss payment retrieve request failed.',
    }
  }

  if (!response.ok) {
    return {
      ok: false,
      status: 502,
      code: 'PAYMENT_RETRIEVE_FAILED',
      message: `Toss payment retrieve failed with HTTP ${response.status}.`,
    }
  }

  return { ok: true, payment: await response.json() as TossPayment }
}

export function isPaidPayment(payment: TossPayment): boolean {
  return payment.status === 'DONE'
}

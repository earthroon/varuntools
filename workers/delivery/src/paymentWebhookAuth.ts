import type { ApiErrorCode, DeliveryEnv, WebhookRawBody } from './types'

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024

export class PaymentWebhookAuthError extends Error {
  constructor(public readonly code: ApiErrorCode, message: string) {
    super(message)
  }
}

function assertStrongSecret(secret: string | undefined): string {
  if (!secret) throw new PaymentWebhookAuthError('PAYMENT_WEBHOOK_SECRET_NOT_CONFIGURED', 'Webhook ingress secret is not configured.')
  if (secret.length < 24) throw new PaymentWebhookAuthError('PAYMENT_WEBHOOK_SECRET_WEAK', 'Webhook ingress secret is too weak.')
  return secret
}

export function timingSafeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder()
  const leftBytes = encoder.encode(left)
  const rightBytes = encoder.encode(right)
  const length = Math.max(leftBytes.length, rightBytes.length)
  let diff = leftBytes.length ^ rightBytes.length

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }

  return diff === 0
}

export async function readWebhookRawJsonWithLimit(request: Request): Promise<WebhookRawBody> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_WEBHOOK_BODY_BYTES) throw new PaymentWebhookAuthError('WEBHOOK_BODY_TOO_LARGE', 'Webhook body is too large.')

  const rawJson = await request.text()
  if (new TextEncoder().encode(rawJson).byteLength > MAX_WEBHOOK_BODY_BYTES) {
    throw new PaymentWebhookAuthError('WEBHOOK_BODY_TOO_LARGE', 'Webhook body is too large.')
  }

  let eventId = ''
  try {
    const body = JSON.parse(rawJson) as { eventId?: unknown; id?: unknown }
    eventId = String(body.eventId ?? body.id ?? '')
  } catch {
    eventId = ''
  }

  return { rawJson, eventId }
}

export function verifyPaymentWebhookIngress(request: Request, env: DeliveryEnv, urlSecret?: string): void {
  const expected = assertStrongSecret(env.PAYMENT_WEBHOOK_SECRET)
  const headerSecret = request.headers.get('x-varuntools-webhook-secret')
  const provided = urlSecret || headerSecret

  if (!provided) throw new PaymentWebhookAuthError('WEBHOOK_AUTH_MISSING', 'Webhook ingress secret is missing.')
  if (!timingSafeEqual(provided, expected)) throw new PaymentWebhookAuthError('WEBHOOK_AUTH_INVALID', 'Webhook ingress secret is invalid.')
}

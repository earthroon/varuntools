import { MIN_PAYMENT_WEBHOOK_SECRET_LENGTH, paymentWebhookConfigured } from './env'
import type { ApiErrorCode, Env } from './types'

export type PaymentWebhookAuthResult =
  | {
      ok: true
      source: 'path' | 'header'
      receivedSecretHash: string
    }
  | {
      ok: false
      status: number
      code: ApiErrorCode
      message: string
    }

const DEFAULT_MAX_BODY_BYTES = 65_536
const SECRET_HEADER = 'x-varuntools-webhook-secret'

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return new Uint8Array(digest)
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0)
  }
  return diff === 0
}

function normalizeSecret(value: string | undefined): string {
  return String(value ?? '').trim()
}

export function getPaymentWebhookMaxBodyBytes(env: Env): number {
  const parsed = Number(env.PAYMENT_WEBHOOK_MAX_BODY_BYTES ?? DEFAULT_MAX_BODY_BYTES)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX_BODY_BYTES
}

export function extractWebhookSecretFromRequest(request: Request): {
  value: string
  source: 'path' | 'header' | 'missing'
} {
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/webhooks\/toss\/([^/]+)$/)
  if (match?.[1]) {
    return { value: decodeURIComponent(match[1]), source: 'path' }
  }

  const headerValue = request.headers.get(SECRET_HEADER)
  if (headerValue) {
    return { value: headerValue, source: 'header' }
  }

  return { value: '', source: 'missing' }
}

export async function verifyPaymentWebhookIngress(
  request: Request,
  env: Env,
): Promise<PaymentWebhookAuthResult> {
  if (!paymentWebhookConfigured(env)) {
    return {
      ok: false,
      status: 501,
      code: 'PAYMENT_WEBHOOK_NOT_CONFIGURED',
      message: 'PAYMENT_WEBHOOK_MODE is not configured.',
    }
  }

  const expectedSecret = normalizeSecret(env.PAYMENT_WEBHOOK_SECRET)
  if (!expectedSecret) {
    return {
      ok: false,
      status: 501,
      code: 'PAYMENT_WEBHOOK_SECRET_NOT_CONFIGURED',
      message: 'PAYMENT_WEBHOOK_SECRET is required for payment webhook ingress.',
    }
  }

  if (expectedSecret.length < MIN_PAYMENT_WEBHOOK_SECRET_LENGTH) {
    return {
      ok: false,
      status: 501,
      code: 'PAYMENT_WEBHOOK_SECRET_WEAK',
      message: `PAYMENT_WEBHOOK_SECRET must be at least ${MIN_PAYMENT_WEBHOOK_SECRET_LENGTH} characters.`,
    }
  }

  const received = extractWebhookSecretFromRequest(request)
  if (received.source === 'missing' || !received.value) {
    return {
      ok: false,
      status: 401,
      code: 'WEBHOOK_AUTH_MISSING',
      message: 'Missing payment webhook ingress secret.',
    }
  }

  const [expectedHash, receivedHash] = await Promise.all([
    sha256(expectedSecret),
    sha256(normalizeSecret(received.value)),
  ])

  if (!timingSafeEqual(expectedHash, receivedHash)) {
    return {
      ok: false,
      status: 401,
      code: 'WEBHOOK_AUTH_INVALID',
      message: 'Invalid payment webhook ingress secret.',
    }
  }

  return {
    ok: true,
    source: received.source,
    receivedSecretHash: bytesToHex(receivedHash),
  }
}

export async function readWebhookRawJsonWithLimit(request: Request, env: Env): Promise<
  | { ok: true; rawJson: string; sizeBytes: number }
  | { ok: false; status: number; code: ApiErrorCode; message: string }
> {
  const maxBytes = getPaymentWebhookMaxBodyBytes(env)
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const parsed = Number(contentLength)
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      return {
        ok: false,
        status: 413,
        code: 'WEBHOOK_BODY_TOO_LARGE',
        message: `Webhook body exceeds ${maxBytes} bytes.`,
      }
    }
  }

  const rawJson = await request.text()
  const sizeBytes = new TextEncoder().encode(rawJson).byteLength
  if (sizeBytes > maxBytes) {
    return {
      ok: false,
      status: 413,
      code: 'WEBHOOK_BODY_TOO_LARGE',
      message: `Webhook body exceeds ${maxBytes} bytes.`,
    }
  }

  return { ok: true, rawJson, sizeBytes }
}

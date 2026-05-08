import type { Env, PaymentRuntimeMode } from './types'

export const R2_BUCKET_BINDING = 'VARUNTOOLS_PRODUCT_BUCKET' as const
export const D1_BINDING = 'PURCHASE_DB' as const
export const MIN_PAYMENT_WEBHOOK_SECRET_LENGTH = 32

export function assertEnv(env: Env): void { void env }

export function r2BucketConfigured(env: Env): boolean {
  return Boolean(env.VARUNTOOLS_PRODUCT_BUCKET)
}

export function normalizePaymentRuntimeMode(value: string | undefined): PaymentRuntimeMode {
  if (value === 'test' || value === 'live') return value
  if (value === 'configured') return 'test'
  return 'not_configured'
}

export function grantValidationConfigured(env: Env): boolean {
  return env.GRANT_VALIDATION_MODE === 'configured' && Boolean(env.PURCHASE_DB)
}

export function paymentWebhookMode(env: Env): PaymentRuntimeMode {
  return normalizePaymentRuntimeMode(env.PAYMENT_WEBHOOK_MODE)
}

export function tossRetrieveMode(env: Env): PaymentRuntimeMode {
  return normalizePaymentRuntimeMode(env.TOSS_RETRIEVE_MODE)
}

export function paymentWebhookConfigured(env: Env): boolean {
  return paymentWebhookMode(env) !== 'not_configured'
}

export function paymentWebhookSecretConfigured(env: Env): boolean {
  const secret = String(env.PAYMENT_WEBHOOK_SECRET ?? '').trim()
  return secret.length >= MIN_PAYMENT_WEBHOOK_SECRET_LENGTH
}

export function tossSecretMatchesMode(env: Env): boolean {
  const key = env.TOSS_SECRET_KEY || ''
  const mode = tossRetrieveMode(env)
  if (mode === 'not_configured') return false
  if (mode === 'test') return key.startsWith('test_sk') || key.startsWith('test_gsk') || env.TOSS_RETRIEVE_MODE === 'configured'
  if (mode === 'live') return key.startsWith('live_sk') || key.startsWith('live_gsk')
  return false
}

export function paymentRetrieveConfigured(env: Env): boolean {
  return tossRetrieveMode(env) !== 'not_configured' && Boolean(env.TOSS_SECRET_KEY) && tossSecretMatchesMode(env)
}

export function paymentActivationConfigured(env: Env): boolean {
  return grantValidationConfigured(env) && paymentWebhookConfigured(env) && paymentWebhookSecretConfigured(env) && paymentRetrieveConfigured(env)
}

export function getGrantTtlHours(env: Env): number {
  const parsed = Number(env.GRANT_TTL_HOURS || 72)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 72
}

export function getDefaultMaxDownloads(env: Env): number {
  const parsed = Number(env.DEFAULT_MAX_DOWNLOADS || 5)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5
}

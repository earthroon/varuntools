import { getDefaultMaxDownloads, getGrantTtlHours, grantValidationConfigured, paymentRetrieveConfigured, paymentWebhookConfigured } from './env'
import { createPurchaseGrantOnce, findPurchaseGrantByOrderProduct, findPurchaseOrderByPaymentKey, insertWebhookEventReceived, updateWebhookEventResult, upsertPurchaseOrder } from './db'
import { isPaidPayment, retrieveTossPaymentSafe } from './toss'
import { bundleIdFromPayment, resolvePaymentEntitlement, variantIdFromPayment } from './variantEntitlements'
import type { ApiErrorCode, DeliveryProduct, Env, PaymentActivationResult, TossPayment } from './types'

type TossWebhookPayload = Record<string, unknown>

function failed(input: {
  eventId?: string
  paymentKey?: string | null
  orderId?: string | null
  code: ApiErrorCode
  httpStatus: number
  reason: string
  productSlug?: string
  paymentStatus?: string
}): PaymentActivationResult {
  return {
    ok: false,
    status: 'failed',
    eventId: input.eventId ?? 'unparsed',
    paymentKey: input.paymentKey ?? null,
    orderId: input.orderId ?? null,
    productSlug: input.productSlug,
    paymentStatus: input.paymentStatus,
    reason: input.reason,
    code: input.code,
    httpStatus: input.httpStatus,
  }
}

function noGrant(input: {
  eventId: string
  paymentKey: string
  orderId: string | null
  reason: string
  productSlug?: string
  paymentStatus?: string
  code?: ApiErrorCode
}): PaymentActivationResult {
  return {
    ok: true,
    status: 'no-grant',
    eventId: input.eventId,
    paymentKey: input.paymentKey,
    orderId: input.orderId,
    productSlug: input.productSlug,
    paymentStatus: input.paymentStatus,
    reason: input.reason,
    code: input.code,
  }
}

function dataFromPayload(payload: TossWebhookPayload): Record<string, unknown> {
  return payload.data && typeof payload.data === 'object' ? payload.data as Record<string, unknown> : payload
}

function extractPaymentKey(payload: TossWebhookPayload): string {
  const data = dataFromPayload(payload)
  return String(data.paymentKey || payload.paymentKey || '')
}

function extractOrderId(payload: TossWebhookPayload): string {
  const data = dataFromPayload(payload)
  return String(data.orderId || payload.orderId || '')
}

function eventTypeFromPayload(payload: TossWebhookPayload): string {
  return String(payload.eventType || payload.type || 'PAYMENT_STATUS_CHANGED')
}

async function stableHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function buildStableWebhookEventId(payload: TossWebhookPayload, rawJson = ''): Promise<string> {
  if (payload.eventId || payload.id) return String(payload.eventId || payload.id)

  const paymentKey = extractPaymentKey(payload)
  const orderId = extractOrderId(payload)
  const eventType = eventTypeFromPayload(payload)
  const createdAt = String(payload.createdAt || '')
  const base = ['toss', eventType, paymentKey, orderId, createdAt, rawJson].join(':')
  return `toss_${await stableHash(base)}`
}

function productSlugFromPayment(payment: TossPayment): string | null {
  return payment.metadata?.productSlug || payment.metadata?.product_slug || payment.metadata?.slug || null
}

function expectedAmountFromPayment(payment: TossPayment): number | null {
  const value = payment.metadata?.expectedAmount || payment.metadata?.expected_amount
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function paymentOrderMatches(payloadOrderId: string, payment: TossPayment): boolean {
  return !payloadOrderId || !payment.orderId || payloadOrderId === payment.orderId
}

function productReadyForGrant(product: DeliveryProduct): boolean {
  return product.launch.readyForCheckout === true && product.delivery.deliverables.length > 0
}

async function markEvent(
  env: Env,
  eventId: string,
  status: 'processed' | 'ignored' | 'failed',
  resultCode: string,
  grantId: string | null,
  errorMessage: string | null,
): Promise<void> {
  await updateWebhookEventResult(env, {
    eventId,
    status,
    resultCode,
    grantId,
    errorMessage,
    now: new Date().toISOString(),
  })
}

export async function activateTossPaymentWebhook(
  rawJson: string,
  env: Env,
  productsBySlug: Map<string, DeliveryProduct>,
): Promise<PaymentActivationResult> {
  if (!grantValidationConfigured(env)) {
    return failed({ code: 'PURCHASE_DB_NOT_CONFIGURED', httpStatus: 501, reason: 'PURCHASE_DB is not configured.' })
  }
  if (!paymentWebhookConfigured(env)) {
    return failed({ code: 'PAYMENT_WEBHOOK_NOT_CONFIGURED', httpStatus: 501, reason: 'PAYMENT_WEBHOOK_MODE is not configured.' })
  }
  if (!paymentRetrieveConfigured(env)) {
    return failed({ code: 'PAYMENT_RETRIEVE_NOT_CONFIGURED', httpStatus: 501, reason: 'Toss payment retrieve is not configured.' })
  }

  let payload: TossWebhookPayload
  try {
    payload = JSON.parse(rawJson) as TossWebhookPayload
  } catch {
    return failed({ code: 'INVALID_WEBHOOK_PAYLOAD', httpStatus: 400, reason: 'Webhook payload must be valid JSON.' })
  }

  const paymentKey = extractPaymentKey(payload)
  const payloadOrderId = extractOrderId(payload)
  const eventType = eventTypeFromPayload(payload)
  const eventId = await buildStableWebhookEventId(payload, rawJson)
  const now = new Date().toISOString()
  const insert = await insertWebhookEventReceived(env, {
    eventId,
    eventType,
    paymentKey: paymentKey || null,
    orderId: payloadOrderId || null,
    rawJson,
    now,
  })

  if (!insert.inserted) {
    return {
      ok: true,
      status: 'already-processed',
      eventId,
      paymentKey,
      orderId: (insert.existing?.order_id ?? payloadOrderId) || null,
      grantId: insert.existing?.grant_id ?? undefined,
      reason: insert.existing?.result_code || 'duplicate-webhook-event',
    }
  }

  if (!paymentKey) {
    await markEvent(env, eventId, 'failed', 'payment-key-missing', null, 'Webhook payload is missing paymentKey.')
    return failed({ eventId, code: 'WEBHOOK_PAYMENT_KEY_MISSING', httpStatus: 400, reason: 'Webhook payload is missing paymentKey.' })
  }

  const retrieve = await retrieveTossPaymentSafe(env, paymentKey)
  if (!retrieve.ok) {
    await markEvent(env, eventId, 'failed', 'payment-retrieve-failed', null, retrieve.message)
    return failed({ eventId, paymentKey, orderId: payloadOrderId || null, code: retrieve.code, httpStatus: retrieve.status, reason: retrieve.message })
  }

  const payment = retrieve.payment
  if (!paymentOrderMatches(payloadOrderId, payment)) {
    await markEvent(env, eventId, 'failed', 'order-mismatch', null, 'Webhook orderId does not match retrieved payment orderId.')
    return failed({ eventId, paymentKey, orderId: payloadOrderId || payment.orderId, code: 'PAYMENT_ORDER_MISMATCH', httpStatus: 409, reason: 'Webhook orderId does not match retrieved payment orderId.', paymentStatus: payment.status })
  }

  const orderId = payment.orderId || payloadOrderId
  if (!isPaidPayment(payment)) {
    await markEvent(env, eventId, 'ignored', 'payment-not-paid', null, `Payment status is ${payment.status}.`)
    return noGrant({ eventId, paymentKey, orderId, reason: 'payment-not-paid', paymentStatus: payment.status, code: 'PAYMENT_NOT_PAID' })
  }

  const productSlug = productSlugFromPayment(payment)
  if (!productSlug) {
    await markEvent(env, eventId, 'failed', 'product-slug-missing', null, 'Payment metadata is missing productSlug.')
    return failed({ eventId, paymentKey, orderId, code: 'PAYMENT_PRODUCT_SLUG_MISSING', httpStatus: 400, reason: 'Payment metadata is missing productSlug.', paymentStatus: payment.status })
  }

  const product = productsBySlug.get(productSlug)
  if (!product) {
    await markEvent(env, eventId, 'failed', 'product-unknown', null, `Unknown productSlug: ${productSlug}.`)
    return failed({ eventId, paymentKey, orderId, productSlug, code: 'PAYMENT_PRODUCT_UNKNOWN', httpStatus: 400, reason: `Unknown productSlug: ${productSlug}.`, paymentStatus: payment.status })
  }

  if (!productReadyForGrant(product)) {
    await markEvent(env, eventId, 'failed', 'product-not-ready-for-checkout', null, 'Product is not ready for checkout or has no deliverables.')
    return failed({ eventId, paymentKey, orderId, productSlug, code: 'PRODUCT_NOT_READY_FOR_CHECKOUT', httpStatus: 409, reason: 'Product is not ready for checkout or has no deliverables.', paymentStatus: payment.status })
  }

  const expectedAmount = expectedAmountFromPayment(payment)
  if (expectedAmount !== null && expectedAmount !== payment.totalAmount) {
    await markEvent(env, eventId, 'failed', 'amount-mismatch', null, 'Payment totalAmount does not match expectedAmount metadata.')
    return failed({ eventId, paymentKey, orderId, productSlug, code: 'PAYMENT_AMOUNT_MISMATCH', httpStatus: 409, reason: 'Payment totalAmount does not match expectedAmount metadata.', paymentStatus: payment.status })
  }

  const entitlement = resolvePaymentEntitlement(payment, product, productsBySlug)
  if (!entitlement.ok) {
    await markEvent(env, eventId, 'failed', 'entitlement-invalid', null, entitlement.reason)
    return failed({ eventId, paymentKey, orderId, productSlug, code: entitlement.code, httpStatus: 409, reason: entitlement.reason, paymentStatus: payment.status })
  }

  const existingOrder = await findPurchaseOrderByPaymentKey(env, paymentKey)
  if (existingOrder) {
    const existingGrant = await findPurchaseGrantByOrderProduct(env, existingOrder.order_id, existingOrder.product_slug, entitlement.variantId, entitlement.bundleId)
    if (existingGrant) {
      await markEvent(env, eventId, 'processed', 'already-granted', existingGrant.id, null)
      return {
        ok: true,
        status: 'already-granted',
        eventId,
        paymentKey,
        orderId: existingOrder.order_id,
        productSlug: existingOrder.product_slug,
        grantId: existingGrant.id,
        variantId: existingGrant.variant_id ?? entitlement.variantId,
        bundleId: existingGrant.bundle_id ?? entitlement.bundleId,
        deliverableCount: entitlement.deliverableIds.length,
      }
    }
  }

  await upsertPurchaseOrder(env, {
    orderId,
    paymentKey,
    productSlug,
    amount: payment.totalAmount,
    status: payment.status,
    buyerEmail: payment.customerEmail ?? null,
    rawJson: JSON.stringify(payment),
    now,
  })

  const expiresAt = new Date(Date.now() + getGrantTtlHours(env) * 60 * 60 * 1000).toISOString()
  const grantResult = await createPurchaseGrantOnce(env, {
    id: crypto.randomUUID(),
    orderId,
    productSlug,
    buyerEmail: payment.customerEmail ?? null,
    deliverableIds: entitlement.deliverableIds,
    variantId: entitlement.variantId,
    bundleId: entitlement.bundleId,
    licenseScope: entitlement.licenseScope,
    entitlementScopeJson: JSON.stringify(entitlement.entitlementScope),
    expiresAt,
    maxDownloads: getDefaultMaxDownloads(env),
    now,
  })

  await markEvent(env, eventId, 'processed', grantResult.created ? 'grant-created' : 'already-granted', grantResult.grant.id, null)

  return {
    ok: true,
    status: grantResult.created ? 'grant-created' : 'already-granted',
    eventId,
    paymentKey,
    orderId,
    productSlug,
    grantId: grantResult.grant.id,
    variantId: entitlement.variantId,
    bundleId: entitlement.bundleId,
    deliverableCount: entitlement.deliverableIds.length,
  }
}

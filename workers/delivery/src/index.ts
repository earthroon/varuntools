import manifestData from './generated/product-delivery-manifest.json'
import { assertEnv, grantValidationConfigured, paymentActivationConfigured, paymentRetrieveConfigured, paymentWebhookMode, paymentWebhookSecretConfigured, tossRetrieveMode } from './env'
import { consumeGrantDownloadAtomically } from './db'
import { validateGrant } from './grants'
import { activateTossPaymentWebhook } from './paymentActivation'
import { readWebhookRawJsonWithLimit, verifyPaymentWebhookIngress } from './paymentWebhookAuth'
import { PrivateDeliveryError, buildDownloadHeaders, getPrivateDeliverableObject } from './r2'
import type { ApiErrorCode, DeliveryManifest, DeliveryProduct, Env } from './types'

const manifest = manifestData as DeliveryManifest
const productsBySlug = new Map<string, DeliveryProduct>(manifest.products.map((product) => [product.slug, product]))

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(data, null, 2), { ...init, headers })
}

function error(status: number, code: ApiErrorCode, message: string): Response {
  return json({ ok: false, error: { code, message } }, { status })
}

function publicProduct(product: DeliveryProduct) {
  return {
    slug: product.slug,
    sku: product.sku,
    title: product.title,
    isDemo: product.isDemo,
    status: product.status,
    visibility: product.visibility,
    delivery: {
      mode: product.delivery.mode,
      provider: product.delivery.provider,
      access: product.delivery.access,
      deliverableCount: product.delivery.deliverables.length,
      variantCount: product.variants?.length ?? 0,
      bundleCount: product.bundles?.length ?? 0,
    },
    launch: product.launch,
  }
}

async function handleHealth(env: Env): Promise<Response> {
  return json({
    ok: true,
    service: 'varuntools-delivery-worker',
    contract: 'Commit 79 — Product Variant / Bundle Delivery Expansion',
    generatedAt: manifest.generatedAt,
    productCount: manifest.products.length,
    grantValidationConfigured: grantValidationConfigured(env),
    paymentRetrieveConfigured: paymentRetrieveConfigured(env),
    paymentActivationConfigured: paymentActivationConfigured(env),
    paymentWebhookMode: paymentWebhookMode(env),
    paymentWebhookSecretConfigured: paymentWebhookSecretConfigured(env),
    tossRetrieveMode: tossRetrieveMode(env),
  })
}

async function handleProductDelivery(slug: string): Promise<Response> {
  const product = productsBySlug.get(slug)
  if (!product) return error(404, 'PRODUCT_NOT_FOUND', `Unknown product slug: ${slug}`)
  return json({ ok: true, product: publicProduct(product) })
}

async function handleClaim(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return error(405, 'METHOD_NOT_ALLOWED', 'Use POST /claims.')
  if (!grantValidationConfigured(env)) {
    return error(501, 'GRANT_VALIDATION_NOT_CONFIGURED', 'Purchase grant claim is not configured yet.')
  }
  return error(501, 'GRANT_VALIDATION_NOT_CONFIGURED', 'Buyer claim lookup is reserved for a later delivery UX commit.')
}

async function handleTossWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return error(405, 'METHOD_NOT_ALLOWED', 'Use POST /webhooks/toss/<PAYMENT_WEBHOOK_SECRET>.')

  const auth = await verifyPaymentWebhookIngress(request, env)
  if (!auth.ok) return error(auth.status, auth.code, auth.message)

  const body = await readWebhookRawJsonWithLimit(request, env)
  if (!body.ok) return error(body.status, body.code, body.message)

  const result = await activateTossPaymentWebhook(body.rawJson, env, productsBySlug)
  if (!result.ok) return json(result, { status: result.httpStatus ?? 500 })
  return json(result, { status: 200 })
}

async function handleDownload(grantId: string, deliverableId: string, env: Env): Promise<Response> {
  const grant = await validateGrant(grantId, deliverableId, env)
  if (!grant.ok) return error(grant.status, grant.code, grant.message)
  const product = productsBySlug.get(grant.productSlug)
  if (!product) return error(404, 'PRODUCT_NOT_FOUND', 'Grant references an unknown product slug.')
  const deliverable = product.delivery.deliverables.find((item) => item.id === deliverableId)
  if (!deliverable) return error(404, 'DELIVERABLE_NOT_FOUND', 'Deliverable is not available for this product.')
  let object: R2ObjectBody
  try {
    object = await getPrivateDeliverableObject(env, deliverable)
  } catch (err) {
    if (err instanceof PrivateDeliveryError) return error(err.status, err.code, err.message)
    throw err
  }
  const consume = await consumeGrantDownloadAtomically(env, {
    grantId: grant.grantId,
    now: new Date().toISOString(),
  })
  if (!consume.ok) return error(consume.status, consume.code, consume.message)

  return new Response(object.body, { headers: buildDownloadHeaders(deliverable, object) })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    assertEnv(env)
    const url = new URL(request.url)
    const pathname = url.pathname.replace(/\/+$/, '') || '/'

    if (request.method === 'OPTIONS') return new Response(null, { status: 204 })
    if (pathname === '/health') return handleHealth(env)

    const productMatch = pathname.match(/^\/products\/([^/]+)\/delivery$/)
    if (productMatch) return handleProductDelivery(decodeURIComponent(productMatch[1]))

    if (pathname === '/claims') return handleClaim(request, env)
    if (pathname === '/webhooks/toss' || pathname.startsWith('/webhooks/toss/')) return handleTossWebhook(request, env)

    const downloadMatch = pathname.match(/^\/download\/([^/]+)\/([^/]+)$/)
    if (downloadMatch) return handleDownload(decodeURIComponent(downloadMatch[1]), decodeURIComponent(downloadMatch[2]), env)

    return error(404, 'NOT_FOUND', 'Unknown delivery worker route.')
  },
}

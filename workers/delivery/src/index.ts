import { consumeGrantDownloadAtomically, type DeliveryDatabase } from './db'
import { activateTossPaymentWebhook } from './paymentActivation'
import { readWebhookRawJsonWithLimit, verifyPaymentWebhookIngress, PaymentWebhookAuthError } from './paymentWebhookAuth'
import type { DeliveryEnv } from './types'

async function getPrivateDeliverableObject(_env: DeliveryEnv, _deliverableId: string): Promise<Response | null> {
  return new Response('private object placeholder')
}

async function handleWebhook(request: Request, env: DeliveryEnv, db: DeliveryDatabase): Promise<Response> {
  const url = new URL(request.url)
  const secretFromPath = url.pathname.startsWith('/webhooks/toss/') ? decodeURIComponent(url.pathname.split('/').pop() ?? '') : undefined
  verifyPaymentWebhookIngress(request, env, secretFromPath)
  const body = await readWebhookRawJsonWithLimit(request)
  return activateTossPaymentWebhook(body.rawJson, env, db)
}

async function handleDownload(request: Request, env: DeliveryEnv, db: DeliveryDatabase): Promise<Response> {
  const url = new URL(request.url)
  const grantId = url.searchParams.get('grantId') ?? ''
  const deliverableId = url.searchParams.get('deliverableId') ?? ''
  const object = await getPrivateDeliverableObject(env, deliverableId)
  if (!object) return Response.json({ ok: false, code: 'DELIVERABLE_NOT_FOUND' }, { status: 404 })
  const consume = await consumeGrantDownloadAtomically(db, grantId)
  if (!consume.ok) return Response.json({ ok: false, code: consume.code ?? 'GRANT_CONSUME_CONFLICT' }, { status: 409 })
  return object
}

export default {
  async fetch(request: Request, env: DeliveryEnv): Promise<Response> {
    const url = new URL(request.url)
    const db = env.DB as DeliveryDatabase

    try {
      if (url.pathname === '/webhooks/toss' || url.pathname.startsWith('/webhooks/toss/')) {
        return handleWebhook(request, env, db)
      }
      if (url.pathname === '/download') {
        return handleDownload(request, env, db)
      }
      return new Response('Not found', { status: 404 })
    } catch (error) {
      if (error instanceof PaymentWebhookAuthError) {
        return Response.json({ ok: false, code: error.code }, { status: 401 })
      }
      return Response.json({ ok: false, code: 'GRANT_CONSUME_CONFLICT' }, { status: 500 })
    }
  },
}

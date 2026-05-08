import type { Env, GrantConsumeResult, PurchaseGrantRow, PurchaseOrderRow, WebhookEventRow, WebhookEventStatus } from './types'

export function purchaseDbConfigured(env: Env): boolean {
  return env.GRANT_VALIDATION_MODE === 'configured' && Boolean(env.PURCHASE_DB)
}

export async function findGrantById(env: Env, grantId: string): Promise<PurchaseGrantRow | null> {
  if (!purchaseDbConfigured(env)) return null
  const result = await env.PURCHASE_DB!.prepare(`SELECT * FROM purchase_grants WHERE id = ? LIMIT 1`).bind(grantId).first<PurchaseGrantRow>()
  return result ?? null
}

export async function findActiveGrant(env: Env, grantId: string): Promise<PurchaseGrantRow | null> {
  if (!purchaseDbConfigured(env)) return null
  const result = await env.PURCHASE_DB!.prepare(`SELECT * FROM purchase_grants WHERE id = ? AND status = 'active' LIMIT 1`).bind(grantId).first<PurchaseGrantRow>()
  return result ?? null
}

export async function findPurchaseGrantByOrderProduct(env: Env, orderId: string, productSlug: string, variantId?: string | null, bundleId?: string | null): Promise<PurchaseGrantRow | null> {
  if (!purchaseDbConfigured(env)) return null
  const result = await env.PURCHASE_DB!.prepare(`SELECT * FROM purchase_grants WHERE order_id = ? AND product_slug = ? AND COALESCE(variant_id, '') = COALESCE(?, '') AND COALESCE(bundle_id, '') = COALESCE(?, '') LIMIT 1`).bind(orderId, productSlug, variantId ?? '', bundleId ?? '').first<PurchaseGrantRow>()
  return result ?? null
}

function isExpiredGrant(row: PurchaseGrantRow, now: string): boolean {
  if (!row.expires_at) return false
  const expiresMs = Date.parse(row.expires_at)
  const nowMs = Date.parse(now)
  if (!Number.isFinite(expiresMs) || !Number.isFinite(nowMs)) return false
  return expiresMs <= nowMs
}

export async function consumeGrantDownloadAtomically(
  env: Env,
  input: { grantId: string; now: string },
): Promise<GrantConsumeResult> {
  if (!purchaseDbConfigured(env)) {
    return {
      ok: false,
      status: 502,
      code: 'PURCHASE_DB_NOT_CONFIGURED',
      message: 'Purchase grant database is not configured. Delivery remains fail-closed.',
    }
  }

  const result = await env.PURCHASE_DB!.prepare(`
    UPDATE purchase_grants
    SET download_count = download_count + 1, updated_at = ?
    WHERE id = ?
      AND status = 'active'
      AND (
        expires_at IS NULL
        OR expires_at = ''
        OR expires_at > ?
      )
      AND (
        max_downloads IS NULL
        OR download_count < max_downloads
      )
  `).bind(input.now, input.grantId, input.now).run()

  const changes = typeof result.meta?.changes === 'number' ? result.meta.changes : 0
  if (changes === 1) {
    const row = await findGrantById(env, input.grantId)
    return {
      ok: true,
      grantId: input.grantId,
      downloadCount: row?.download_count ?? 0,
      maxDownloads: row?.max_downloads ?? null,
      consumedAt: input.now,
    }
  }

  const row = await findGrantById(env, input.grantId)
  if (!row) {
    return {
      ok: false,
      status: 403,
      code: 'GRANT_NOT_FOUND',
      message: 'Purchase grant was not found.',
    }
  }

  if (row.status === 'revoked' || row.status === 'refunded') {
    return {
      ok: false,
      status: 403,
      code: 'GRANT_REVOKED',
      message: 'Purchase grant has been revoked.',
    }
  }

  if (row.status !== 'active') {
    return {
      ok: false,
      status: 403,
      code: 'GRANT_INACTIVE',
      message: `Purchase grant is ${row.status}.`,
    }
  }

  if (isExpiredGrant(row, input.now)) {
    return {
      ok: false,
      status: 410,
      code: 'GRANT_EXPIRED',
      message: 'Purchase grant has expired.',
    }
  }

  if (row.max_downloads != null && row.download_count >= row.max_downloads) {
    return {
      ok: false,
      status: 410,
      code: 'GRANT_DOWNLOAD_LIMIT_REACHED',
      message: 'Purchase grant download limit has been reached.',
    }
  }

  return {
    ok: false,
    status: 409,
    code: 'GRANT_CONSUME_CONFLICT',
    message: 'Purchase grant could not be consumed atomically. Retry the download request.',
  }
}

export async function findWebhookEvent(env: Env, eventId: string): Promise<WebhookEventRow | null> {
  if (!purchaseDbConfigured(env)) return null
  const result = await env.PURCHASE_DB!.prepare(`SELECT * FROM webhook_events WHERE event_id = ? LIMIT 1`).bind(eventId).first<WebhookEventRow>()
  return result ?? null
}

export async function insertWebhookEvent(env: Env, event: WebhookEventRow): Promise<void> {
  if (!purchaseDbConfigured(env)) throw new Error('PURCHASE_DB is not configured.')
  await env.PURCHASE_DB!.prepare(`INSERT INTO webhook_events (event_id, event_type, payment_key, order_id, raw_json, processed_at) VALUES (?, ?, ?, ?, ?, ?)`).bind(event.event_id, event.event_type, event.payment_key, event.order_id, event.raw_json, event.processed_at).run()
}

export async function insertWebhookEventReceived(
  env: Env,
  input: {
    eventId: string
    eventType: string
    paymentKey: string | null
    orderId: string | null
    rawJson: string
    now: string
  },
): Promise<{ inserted: boolean; existing?: WebhookEventRow | null }> {
  if (!purchaseDbConfigured(env)) throw new Error('PURCHASE_DB is not configured.')
  const result = await env.PURCHASE_DB!.prepare(`
    INSERT INTO webhook_events
      (event_id, event_type, payment_key, order_id, raw_json, processed_at, status, received_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'received', ?, ?)
    ON CONFLICT(event_id) DO NOTHING
  `).bind(
    input.eventId,
    input.eventType,
    input.paymentKey,
    input.orderId,
    input.rawJson,
    input.now,
    input.now,
    input.now,
  ).run()

  const changes = typeof result.meta?.changes === 'number' ? result.meta.changes : 1
  if (changes === 0) {
    return { inserted: false, existing: await findWebhookEvent(env, input.eventId) }
  }

  return { inserted: true }
}

export async function updateWebhookEventResult(
  env: Env,
  input: {
    eventId: string
    status: WebhookEventStatus
    resultCode: string
    grantId?: string | null
    errorMessage?: string | null
    now: string
  },
): Promise<void> {
  if (!purchaseDbConfigured(env)) throw new Error('PURCHASE_DB is not configured.')
  await env.PURCHASE_DB!.prepare(`
    UPDATE webhook_events
    SET status = ?, result_code = ?, grant_id = ?, error_message = ?, updated_at = ?, processed_at = ?
    WHERE event_id = ?
  `).bind(
    input.status,
    input.resultCode,
    input.grantId ?? null,
    input.errorMessage ?? null,
    input.now,
    input.now,
    input.eventId,
  ).run()
}

export async function findPurchaseOrderByPaymentKey(env: Env, paymentKey: string): Promise<PurchaseOrderRow | null> {
  if (!purchaseDbConfigured(env)) return null
  const result = await env.PURCHASE_DB!.prepare(`SELECT * FROM purchase_orders WHERE payment_key = ? LIMIT 1`).bind(paymentKey).first<PurchaseOrderRow>()
  return result ?? null
}

export async function upsertPurchaseOrder(env: Env, input: { orderId: string; paymentKey: string; productSlug: string; amount: number; status: string; buyerEmail?: string | null; rawJson: string; now: string }): Promise<void> {
  if (!purchaseDbConfigured(env)) throw new Error('PURCHASE_DB is not configured.')
  await env.PURCHASE_DB!.prepare(`INSERT INTO purchase_orders (order_id, payment_key, product_slug, amount, status, buyer_email, raw_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(payment_key) DO UPDATE SET status = excluded.status, raw_json = excluded.raw_json, updated_at = excluded.updated_at`).bind(input.orderId, input.paymentKey, input.productSlug, input.amount, input.status, input.buyerEmail ?? null, input.rawJson, input.now, input.now).run()
}


export type CreatePurchaseGrantInput = { id: string; orderId: string; productSlug: string; deliverableIds: string[]; buyerEmail?: string | null; expiresAt?: string | null; maxDownloads?: number | null; now: string; variantId?: string | null; bundleId?: string | null; entitlementScopeJson?: string | null; licenseScope?: string | null }

export async function createPurchaseGrant(env: Env, input: CreatePurchaseGrantInput): Promise<void> {
  if (!purchaseDbConfigured(env)) throw new Error('PURCHASE_DB is not configured.')
  await env.PURCHASE_DB!.prepare(`INSERT INTO purchase_grants (id, order_id, product_slug, deliverable_ids_json, buyer_email, status, expires_at, max_downloads, download_count, created_at, updated_at, variant_id, bundle_id, entitlement_scope_json, license_scope) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING`).bind(input.id, input.orderId, input.productSlug, JSON.stringify(input.deliverableIds), input.buyerEmail ?? null, input.expiresAt ?? null, input.maxDownloads ?? null, input.now, input.now, input.variantId ?? null, input.bundleId ?? null, input.entitlementScopeJson ?? null, input.licenseScope ?? null).run()
}

export async function createPurchaseGrantOnce(
  env: Env,
  input: CreatePurchaseGrantInput,
): Promise<{ created: boolean; grant: PurchaseGrantRow }> {
  const existing = await findPurchaseGrantByOrderProduct(env, input.orderId, input.productSlug, input.variantId ?? null, input.bundleId ?? null)
  if (existing) return { created: false, grant: existing }
  await createPurchaseGrant(env, input)
  const grant = await findPurchaseGrantByOrderProduct(env, input.orderId, input.productSlug, input.variantId ?? null, input.bundleId ?? null)
  if (!grant) throw new Error('PURCHASE_GRANT_CREATE_FAILED')
  return { created: grant.id === input.id, grant }
}


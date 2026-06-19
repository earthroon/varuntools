import type { GrantConsumeResult, TossPaymentSnapshot } from './types'

type D1RunResult = { meta?: { changes?: number } }
type D1BoundStatement = {
  run(): Promise<D1RunResult>
  first<T = unknown>(): Promise<T | null>
}
type D1PreparedStatement = {
  bind(...values: unknown[]): D1BoundStatement
}
export type DeliveryDatabase = {
  prepare(query: string): D1PreparedStatement
}

export async function insertWebhookEventReceived(db: DeliveryDatabase, event: {
  eventId: string
  paymentKey?: string
  eventType?: string
  rawJson: string
}): Promise<boolean> {
  const result = await db.prepare(`
    INSERT INTO webhook_events (event_id, payment_key, event_type, raw_json, received_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(event_id) DO NOTHING
  `).bind(event.eventId, event.paymentKey ?? null, event.eventType ?? null, event.rawJson).run()

  return Number(result.meta?.changes ?? 0) > 0
}

export async function createPurchaseGrantOnce(db: DeliveryDatabase, payment: TossPaymentSnapshot): Promise<string> {
  const grantId = `grant_${payment.paymentKey}`
  await db.prepare(`
    INSERT INTO purchase_grants (id, payment_key, status, download_count, created_at)
    VALUES (?, ?, 'active', 0, datetime('now'))
    ON CONFLICT(id) DO NOTHING
  `).bind(grantId, payment.paymentKey).run()
  return grantId
}

export async function consumeGrantDownloadAtomically(db: DeliveryDatabase, grantId: string): Promise<GrantConsumeResult> {
  const result = await db.prepare(`
    UPDATE purchase_grants
    SET download_count = download_count + 1,
        last_downloaded_at = datetime('now')
    WHERE id = ?
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at = '' OR expires_at > datetime('now'))
      AND (max_downloads IS NULL OR download_count < max_downloads)
  `).bind(grantId).run()

  if (Number(result.meta?.changes ?? 0) <= 0) {
    return { ok: false, code: 'GRANT_DOWNLOAD_LIMIT_REACHED' }
  }

  return { ok: true, grantId }
}

export async function readGrant(db: DeliveryDatabase, grantId: string): Promise<unknown> {
  return db.prepare('SELECT * FROM purchase_grants WHERE id = ?').bind(grantId).first()
}

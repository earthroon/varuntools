import type { AdminActionAuditSummary, AdminAuditLogQuery, AdminGrantSummary, AdminListQuery, AdminOrderSummary, AdminWebhookEventSummary, Env, Paginated } from './types'
import { maskEmail, maskPaymentKey } from './redact'
function page<T>(items:T[], limit:number, offset:number):Paginated<T>{ return { items, limit, offset, nextCursor: items.length === limit ? String(offset + limit) : null } }
export async function listOrders(env:Env, query:AdminListQuery):Promise<Paginated<AdminOrderSummary>>{ const stmt = env.ADMIN_DB!.prepare('SELECT order_id, product_slug, status, amount, currency, payment_provider, payment_key, buyer_email, created_at, updated_at FROM purchase_orders ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(query.limit, query.offset); const result = await stmt.all<Record<string, unknown>>(); return page((result.results ?? []).map((r)=>({ orderId:String(r.order_id??''), productSlug:String(r.product_slug??''), status:String(r.status??''), amount:r.amount==null?null:Number(r.amount), currency:r.currency?String(r.currency):null, paymentProvider:r.payment_provider?String(r.payment_provider):null, paymentKeyMasked:maskPaymentKey(r.payment_key?String(r.payment_key):null), buyerEmailMasked:maskEmail(r.buyer_email?String(r.buyer_email):null), createdAt:r.created_at?String(r.created_at):null, updatedAt:r.updated_at?String(r.updated_at):null })), query.limit, query.offset) }
export async function listGrants(env:Env, query:AdminListQuery):Promise<Paginated<AdminGrantSummary>>{ const stmt = env.ADMIN_DB!.prepare('SELECT id, order_id, product_slug, status, deliverable_ids_json, download_count, max_downloads, expires_at, buyer_email, created_at FROM purchase_grants ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(query.limit, query.offset); const result = await stmt.all<Record<string, unknown>>(); return page((result.results ?? []).map((r)=>({ grantId:String(r.id??''), orderId:String(r.order_id??''), productSlug:String(r.product_slug??''), status:String(r.status??''), variantId: null, bundleId: null, licenseScope: null, deliverableCount: String(r.deliverable_ids_json??'[]').includes(',') ? String(r.deliverable_ids_json).split(',').length : 1, downloadCount:Number(r.download_count??0), maxDownloads:r.max_downloads==null?null:Number(r.max_downloads), expiresAt:r.expires_at?String(r.expires_at):null, createdAt:r.created_at?String(r.created_at):null, buyerEmailMasked:maskEmail(r.buyer_email?String(r.buyer_email):null) })), query.limit, query.offset) }
export async function listWebhookEvents(env:Env, query:AdminListQuery):Promise<Paginated<AdminWebhookEventSummary>>{ const stmt = env.ADMIN_DB!.prepare('SELECT event_id, event_type, status, result_code, payment_key, order_id, grant_id, received_at, updated_at FROM webhook_events ORDER BY received_at DESC LIMIT ? OFFSET ?').bind(query.limit, query.offset); const result = await stmt.all<Record<string, unknown>>(); return page((result.results ?? []).map((r)=>({ eventId:String(r.event_id??''), eventType:String(r.event_type??''), status:String(r.status??''), resultCode:r.result_code?String(r.result_code):null, paymentKeyMasked:maskPaymentKey(r.payment_key?String(r.payment_key):null), orderId:r.order_id?String(r.order_id):null, grantId:r.grant_id?String(r.grant_id):null, receivedAt:r.received_at?String(r.received_at):null, updatedAt:r.updated_at?String(r.updated_at):null })), query.limit, query.offset) }

function boolFromDb(value: unknown): boolean { return Number(value ?? 0) === 1 }

export async function listAdminActionAuditLog(env:Env, query:AdminAuditLogQuery):Promise<Paginated<AdminActionAuditSummary>>{
  const clauses:string[] = []
  const binds:unknown[] = []
  if (query.actionKind) { clauses.push('action_kind = ?'); binds.push(query.actionKind) }
  if (query.targetId) { clauses.push('target_id = ?'); binds.push(query.targetId) }
  if (query.requestId) { clauses.push('request_id = ?'); binds.push(query.requestId) }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const stmt = env.ADMIN_DB!.prepare(`SELECT id, action_kind, mode, actor_email_masked, actor_sub, target_type, target_id, order_id, product_slug, variant_id, bundle_id, risk_level, reason, plan_status, plan_valid, execution_allowed, runtime_blocked, confirm_phrase_matched, request_id, created_at FROM admin_action_audit_log ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds, query.limit, query.offset)
  const result = await stmt.all<Record<string, unknown>>()
  return page((result.results ?? []).map((r)=>({
    id:String(r.id??''),
    actionKind:String(r.action_kind??'support-note') as AdminActionAuditSummary['actionKind'],
    mode:String(r.mode??'dry-run') as AdminActionAuditSummary['mode'],
    actorEmailMasked:r.actor_email_masked?String(r.actor_email_masked):null,
    actorSub:r.actor_sub?String(r.actor_sub):null,
    targetType:String(r.target_type??''),
    targetId:String(r.target_id??''),
    orderId:r.order_id?String(r.order_id):null,
    productSlug:r.product_slug?String(r.product_slug):null,
    variantId:r.variant_id?String(r.variant_id):null,
    bundleId:r.bundle_id?String(r.bundle_id):null,
    riskLevel:String(r.risk_level??'low') as AdminActionAuditSummary['riskLevel'],
    reason:r.reason?String(r.reason):null,
    planStatus:String(r.plan_status??'runtime-blocked') as AdminActionAuditSummary['planStatus'],
    planValid:boolFromDb(r.plan_valid),
    executionAllowed:boolFromDb(r.execution_allowed),
    runtimeBlocked:boolFromDb(r.runtime_blocked),
    confirmPhraseMatched:boolFromDb(r.confirm_phrase_matched),
    requestId:r.request_id?String(r.request_id):null,
    createdAt:String(r.created_at??''),
  })), query.limit, query.offset)
}

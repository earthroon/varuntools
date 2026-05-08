import { grantValidationConfigured } from './env'
import { findGrantById } from './db'
import { parseGrantEntitlementScope } from './variantEntitlements'
import type { Env, GrantValidationResult } from './types'
function parseDeliverableIds(raw: string): string[] | null { try { const parsed = JSON.parse(raw); if (!Array.isArray(parsed)) return null; return parsed.map(String).filter(Boolean) } catch { return null } }
function isExpired(expiresAt: string | null): boolean { if (!expiresAt) return false; const expiresMs = Date.parse(expiresAt); return Number.isFinite(expiresMs) && expiresMs < Date.now() }
export async function validateGrant(grantId: string, deliverableId: string, env: Env): Promise<GrantValidationResult> {
  if (!grantValidationConfigured(env)) return { ok: false, status: 501, code: 'GRANT_VALIDATION_NOT_CONFIGURED', message: 'Purchase grant validation is not configured yet. Downloads remain fail-closed.' }
  if (!grantId || !deliverableId) return { ok: false, status: 400, code: 'INVALID_GRANT_REQUEST', message: 'Download request is missing grantId or deliverableId.' }
  const row = await findGrantById(env, grantId)
  if (!row) return { ok: false, status: 403, code: 'GRANT_NOT_FOUND', message: 'Purchase grant was not found.' }
  if (row.status === 'revoked' || row.status === 'refunded') return { ok: false, status: 403, code: 'GRANT_REVOKED', message: 'Purchase grant has been revoked.' }
  if (row.status !== 'active') return { ok: false, status: 403, code: 'GRANT_INACTIVE', message: `Purchase grant is ${row.status}.` }
  if (isExpired(row.expires_at)) return { ok: false, status: 410, code: 'GRANT_EXPIRED', message: 'Purchase grant has expired.' }
  if (row.max_downloads != null && row.download_count >= row.max_downloads) return { ok: false, status: 410, code: 'GRANT_DOWNLOAD_LIMIT_REACHED', message: 'Purchase grant download limit has been reached.' }
  const entitlement = parseGrantEntitlementScope(row.entitlement_scope_json)
  const deliverableIds = entitlement?.deliverableIds ?? parseDeliverableIds(row.deliverable_ids_json)
  if (!deliverableIds) return { ok: false, status: 403, code: 'GRANT_INACTIVE', message: 'Purchase grant deliverable scope is invalid.' }
  const scopedIdCandidates = new Set([deliverableId, `${row.product_slug}:${deliverableId}`])
  if (![...scopedIdCandidates].some((candidate) => deliverableIds.includes(candidate))) return { ok: false, status: 404, code: 'GRANT_DELIVERABLE_MISMATCH', message: 'Requested deliverable is not available for this purchase grant.' }
  return { ok: true, grantId: row.id, orderId: row.order_id, productSlug: row.product_slug, deliverableIds, downloadCount: row.download_count, maxDownloads: row.max_downloads, expiresAt: row.expires_at, variantId: row.variant_id ?? entitlement?.variantId ?? null, bundleId: row.bundle_id ?? entitlement?.bundleId ?? null, licenseScope: row.license_scope ?? entitlement?.licenseScope ?? null }
}

// Backward compatibility smoke anchor: legacy product-level grants still use deliverableIds.includes(deliverableId).

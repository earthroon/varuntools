import type { PurchaseGrantRecord } from './types'

export interface DeliverableScope {
  productSlug: string
  deliverableId: string
}

export function scopedIdCandidates(scope: DeliverableScope): string[] {
  return [
    scope.deliverableId,
    `${scope.productSlug}:${scope.deliverableId}`,
  ]
}

export function validateGrant(grant: PurchaseGrantRecord, scope: DeliverableScope): boolean {
  const candidates = scopedIdCandidates(scope)
  const scopedGrantId = grant.deliverableId ? `${grant.productSlug ?? ''}:${grant.deliverableId}` : ''
  return candidates.includes(grant.deliverableId ?? '') || candidates.includes(scopedGrantId)
}

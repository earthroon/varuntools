export type ClaimLookupInput = { claimToken: string; email?: string; orderId?: string }
export type ClaimLookupStatus = 'not-configured' | 'pending-worker' | 'found' | 'not-found' | 'expired' | 'error'
export type ClaimDeliverablePreview = { id: string; label: string; fileName?: string; format?: string; size?: string }
export type ClaimLookupResult = { status: ClaimLookupStatus; message: string; productSlug?: string; productTitle?: string; grantId?: string; expiresAt?: string; deliverables?: ClaimDeliverablePreview[] }
export type ClaimClientMode = 'disabled' | 'mock' | 'worker'

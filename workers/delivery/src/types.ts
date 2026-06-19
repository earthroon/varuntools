export type ApiErrorCode =
  | 'PAYMENT_WEBHOOK_SECRET_NOT_CONFIGURED'
  | 'PAYMENT_WEBHOOK_SECRET_WEAK'
  | 'WEBHOOK_AUTH_MISSING'
  | 'WEBHOOK_AUTH_INVALID'
  | 'WEBHOOK_BODY_TOO_LARGE'
  | 'WEBHOOK_PAYMENT_KEY_MISSING'
  | 'GRANT_DOWNLOAD_LIMIT_REACHED'
  | 'GRANT_CONSUME_CONFLICT'
  | 'GRANT_NOT_FOUND'
  | 'DELIVERABLE_NOT_FOUND'

export interface DeliveryEnv {
  PAYMENT_WEBHOOK_SECRET?: string
  TOSS_SECRET_KEY?: string
  DB?: unknown
  PRIVATE_DELIVERABLE_BUCKET?: unknown
}

export interface ApiErrorPayload {
  code: ApiErrorCode
  message: string
}

export interface GrantConsumeResult {
  ok: boolean
  code?: ApiErrorCode
  grantId?: string
  downloadCount?: number
}

export interface WebhookRawBody {
  rawJson: string
  eventId: string
  secretHint?: string
}

export interface TossPaymentSnapshot {
  paymentKey: string
  orderId?: string
  status?: string
  totalAmount?: number
  approvedAt?: string
}

export interface PurchaseGrantRecord {
  id: string
  status: 'active' | 'revoked' | 'expired'
  productSlug?: string
  deliverableId?: string
  download_count: number
  max_downloads?: number | null
  expires_at?: string | null
}

export type DeliveryMode = 'post-purchase'
export type DeliveryProvider = 'cloudflare-r2'
export type DeliveryAccess = 'private'

export type ProductDeliverable = {
  id: string
  label: string
  fileName: string
  contentType: string
  sizeBytes: number | null
  sha256?: string
  r2Key: string
  uploadedAt?: string | null
  verifiedAt?: string | null
}

export type DeliveryProductVariant = { id: string; label: string; status: string; licenseScope?: string; price?: number | null; currency?: string; checkoutMode?: string; checkoutUrl?: string; deliverableSetId?: string; default?: boolean }
export type DeliveryProductDeliverableSet = { id: string; label: string; deliverableIds: string[] }
export type DeliveryProductBundle = { id: string; label: string; status: string; productSlugs: string[]; variantRefs?: Array<{ productSlug: string; variantId: string }>; price?: number | null; currency?: string; checkoutMode?: string; checkoutUrl?: string }

export type GrantEntitlementScope = { productSlug: string; variantId?: string | null; bundleId?: string | null; deliverableSetIds: string[]; deliverableIds: string[]; licenseScope?: string | null }

export type DeliveryProduct = {
  slug: string
  sku: string
  title: string
  isDemo: boolean
  status: string
  visibility: string
  checkout?: { provider: string; mode: string }
  delivery: {
    mode: DeliveryMode
    provider: DeliveryProvider
    access: DeliveryAccess
    bucketBinding: string
    keyPrefix: string
    deliverables: ProductDeliverable[]
  }
  variants?: DeliveryProductVariant[]
  deliverableSets?: DeliveryProductDeliverableSet[]
  bundles?: DeliveryProductBundle[]
  launch: {
    readyForCatalog: boolean
    readyForCheckout: boolean
  }
  source: string
}

export type DeliveryManifest = {
  schemaVersion: 1
  generatedAt: string
  warning: string
  products: DeliveryProduct[]
}

export type PaymentRuntimeMode = 'not_configured' | 'test' | 'live'

export type Env = {
  VARUNTOOLS_PRODUCT_BUCKET?: R2Bucket
  PURCHASE_DB?: D1Database
  DELIVERY_ENV?: string
  GRANT_VALIDATION_MODE?: string
  TOSS_RETRIEVE_MODE?: PaymentRuntimeMode | 'configured' | string
  TOSS_SECRET_KEY?: string
  PAYMENT_WEBHOOK_MODE?: PaymentRuntimeMode | 'configured' | string
  PAYMENT_WEBHOOK_SECRET?: string
  PAYMENT_WEBHOOK_MAX_BODY_BYTES?: string
  GRANT_TTL_HOURS?: string
  DEFAULT_MAX_DOWNLOADS?: string
}

export type PurchaseOrderRow = {
  order_id: string
  payment_key: string
  product_slug: string
  amount: number
  status: string
  buyer_email: string | null
  raw_json: string
  created_at: string
  updated_at: string
}

export type PurchaseGrantRow = {
  id: string
  order_id: string
  product_slug: string
  deliverable_ids_json: string
  buyer_email: string | null
  status: string
  expires_at: string | null
  max_downloads: number | null
  download_count: number
  created_at: string
  updated_at: string
  variant_id?: string | null
  bundle_id?: string | null
  entitlement_scope_json?: string | null
  license_scope?: string | null
}

export type WebhookEventStatus = 'received' | 'processing' | 'processed' | 'ignored' | 'failed'

export type WebhookEventRow = {
  event_id: string
  event_type: string
  payment_key: string | null
  order_id: string | null
  raw_json: string
  processed_at: string
  status?: WebhookEventStatus | string
  result_code?: string | null
  grant_id?: string | null
  error_message?: string | null
  received_at?: string | null
  updated_at?: string | null
}

export type TossPayment = {
  paymentKey: string
  orderId: string
  orderName?: string
  status: string
  totalAmount: number
  method?: string
  approvedAt?: string
  requestedAt?: string
  metadata?: Record<string, string>
  customerEmail?: string
}

export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'INVALID_REQUEST'
  | 'INVALID_WEBHOOK_PAYLOAD'
  | 'WEBHOOK_PAYMENT_KEY_MISSING'
  | 'WEBHOOK_ALREADY_PROCESSED'
  | 'WEBHOOK_AUTH_MISSING'
  | 'WEBHOOK_AUTH_INVALID'
  | 'WEBHOOK_BODY_TOO_LARGE'
  | 'PRODUCT_NOT_FOUND'
  | 'DELIVERABLE_NOT_FOUND'
  | 'INVALID_GRANT_REQUEST'
  | 'GRANT_NOT_FOUND'
  | 'GRANT_INACTIVE'
  | 'GRANT_REVOKED'
  | 'GRANT_EXPIRED'
  | 'GRANT_DOWNLOAD_LIMIT_REACHED'
  | 'GRANT_DELIVERABLE_MISMATCH'
  | 'GRANT_PRODUCT_MISMATCH'
  | 'GRANT_CONSUME_CONFLICT'
  | 'GRANT_VALIDATION_NOT_CONFIGURED'
  | 'PURCHASE_DB_NOT_CONFIGURED'
  | 'R2_BUCKET_NOT_CONFIGURED'
  | 'R2_OBJECT_MISSING'
  | 'PAYMENT_WEBHOOK_NOT_CONFIGURED'
  | 'PAYMENT_WEBHOOK_SECRET_NOT_CONFIGURED'
  | 'PAYMENT_WEBHOOK_SECRET_WEAK'
  | 'PAYMENT_RETRIEVE_NOT_CONFIGURED'
  | 'PAYMENT_RETRIEVE_FAILED'
  | 'PAYMENT_NOT_PAID'
  | 'PAYMENT_PRODUCT_SLUG_MISSING'
  | 'PAYMENT_PRODUCT_UNKNOWN'
  | 'PAYMENT_ORDER_MISMATCH'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'PRODUCT_NOT_READY_FOR_CHECKOUT'
  | 'GRANT_ALREADY_EXISTS'
  | 'PAYMENT_VARIANT_UNKNOWN'
  | 'PAYMENT_BUNDLE_UNKNOWN'
  | 'PAYMENT_ENTITLEMENT_INVALID'

export type GrantValidationSuccess = {
  ok: true
  grantId: string
  orderId: string
  productSlug: string
  deliverableIds: string[]
  downloadCount: number
  maxDownloads: number | null
  expiresAt: string | null
  variantId?: string | null
  bundleId?: string | null
  licenseScope?: string | null
}

export type GrantValidationFailure = {
  ok: false
  status: number
  code: ApiErrorCode
  message: string
}

export type GrantValidationResult = GrantValidationSuccess | GrantValidationFailure

export type GrantConsumeSuccess = {
  ok: true
  grantId: string
  downloadCount: number
  maxDownloads: number | null
  consumedAt: string
}

export type GrantConsumeFailure = {
  ok: false
  status: number
  code: ApiErrorCode
  message: string
}

export type GrantConsumeResult = GrantConsumeSuccess | GrantConsumeFailure

export type TossRetrieveResult =
  | { ok: true; payment: TossPayment }
  | { ok: false; status: number; code: ApiErrorCode; message: string }

export type PaymentActivationStatus =
  | 'grant-created'
  | 'already-processed'
  | 'already-granted'
  | 'no-grant'
  | 'failed'

export type PaymentActivationResult = {
  ok: boolean
  status: PaymentActivationStatus
  eventId: string
  paymentKey: string | null
  orderId: string | null
  productSlug?: string
  grantId?: string
  variantId?: string | null
  bundleId?: string | null
  deliverableCount?: number
  reason?: string
  paymentStatus?: string
  code?: ApiErrorCode
  httpStatus?: number
}

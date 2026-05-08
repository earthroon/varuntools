export type AdminApiMode = 'not_configured' | 'test' | 'live'
export type AdminWriteMode = 'disabled' | 'dry-run' | 'enabled'

export type Env = {
  ADMIN_DB?: D1Database
  INQUIRY_DB?: D1Database
  ACCESS_TEAM_DOMAIN?: string
  ACCESS_AUD?: string
  ACCESS_ALLOWED_EMAILS?: string
  ADMIN_API_MODE?: AdminApiMode
  ADMIN_API_READ_ONLY?: string
  ADMIN_WRITE_MODE?: AdminWriteMode
  ADMIN_WRITE_ALLOWED_EMAILS?: string
  ADMIN_WRITE_REQUIRE_CONFIRM?: string
  ADMIN_WRITE_AUDIT_LOG_REQUIRED?: string
}

export type AccessIdentity = { email: string; aud: string; exp: number; iat?: number; nbf?: number; iss: string; sub?: string; type?: string }
export type AdminListQuery = { limit: number; offset: number; status?: string; productSlug?: string; orderId?: string }
export type Paginated<T> = { items: T[]; limit: number; offset: number; nextCursor: string | null }
export type AdminOrderSummary = { orderId:string; productSlug:string; status:string; amount:number|null; currency:string|null; paymentProvider:string|null; paymentKeyMasked:string|null; buyerEmailMasked:string|null; createdAt:string|null; updatedAt:string|null }
export type AdminGrantSummary = { grantId:string; orderId:string; productSlug:string; variantId:string|null; bundleId:string|null; licenseScope:string|null; status:string; deliverableCount:number; downloadCount:number; maxDownloads:number|null; expiresAt:string|null; createdAt:string|null; buyerEmailMasked:string|null }
export type AdminWebhookEventSummary = { eventId:string; eventType:string; status:string; resultCode:string|null; paymentKeyMasked:string|null; orderId:string|null; grantId:string|null; receivedAt:string|null; updatedAt:string|null }
export type AdminProductOpsSummary = { slug:string; title:string; sku:string|null; readyForCatalog:boolean; readyForCheckout:boolean; checkoutProvider:string|null; checkoutMode:string|null; deliverableCount:number; variantCount:number; bundleCount:number; defaultVariantId:string|null; isDemo:boolean; visibility:string }
export type AdminDeliveryIncidentSummary = { id:string; type:string; severity:'info'|'warning'|'blocker'; productSlug?:string; orderId?:string; grantId?:string; message:string; createdAt?:string }

export type AdminWriteActionKind =
  | 'grant-revoke'
  | 'grant-reissue'
  | 'refund-note'
  | 'support-note'
  | 'webhook-replay'

export type AdminWriteActionMode = 'disabled' | 'dry-run' | 'enabled'
export type AdminWriteRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type AdminWriteActorRole = 'viewer' | 'operator' | 'owner'

export type AdminWriteActionCheck = {
  code: string
  label: string
  passed: boolean
  severity: 'info' | 'warning' | 'blocker'
  message: string
}

export type AdminWriteActionChange = {
  table: 'purchase_grants' | 'purchase_orders' | 'webhook_events' | 'admin_action_audit_log'
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  description: string
}

export type AdminWriteActionPlanStatus =
  | 'draft'
  | 'valid-dry-run'
  | 'invalid-dry-run'
  | 'runtime-blocked'
  | 'execution-ready'
  | 'blocked'

export type AdminWriteActionPlan = {
  /** @deprecated Use planValid for dry-run plan validity. */
  ok: boolean
  /** @deprecated Use executionAllowed for runtime mutation permission. */
  allowed: boolean

  action: AdminWriteActionKind
  mode: AdminWriteActionMode
  riskLevel: AdminWriteRiskLevel
  status: AdminWriteActionPlanStatus

  planGenerated: boolean
  planValid: boolean
  dryRunAllowed: boolean
  executionAllowed: boolean
  runtimeBlocked: boolean
  confirmationRequired: boolean
  confirmationSatisfied: boolean
  auditRequired: boolean
  auditReady: boolean

  blockedReason?: string
  executionBlockedReason?: string
  requiredRole: AdminWriteActorRole
  actorRole: AdminWriteActorRole
  requiredConfirmPhrase: string
  target: {
    grantId?: string
    orderId?: string
    eventId?: string
    productSlug?: string
    variantId?: string | null
    bundleId?: string | null
  }
  checks: AdminWriteActionCheck[]
  wouldChange: AdminWriteActionChange[]
  warnings: string[]
  auditLogId?: string
  auditRecordedAt?: string
  requestId?: string
}

export type AdminActionAuditSummary = {
  id: string
  actionKind: AdminWriteActionKind
  mode: AdminWriteActionMode
  actorEmailMasked: string | null
  actorSub: string | null
  targetType: string
  targetId: string
  orderId: string | null
  productSlug: string | null
  variantId: string | null
  bundleId: string | null
  riskLevel: AdminWriteRiskLevel
  reason: string | null
  planStatus: AdminWriteActionPlanStatus
  planValid: boolean
  executionAllowed: boolean
  runtimeBlocked: boolean
  confirmPhraseMatched: boolean
  requestId: string | null
  createdAt: string
}

export type AdminAuditLogQuery = AdminListQuery & {
  actionKind?: AdminWriteActionKind
  targetId?: string
  requestId?: string
}

export type AdminDryRunInput = {
  reason?: string
  confirmPhrase?: string
  operatorNote?: string
  requestedDeliverableIds?: string[]
}

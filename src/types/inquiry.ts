export type InquiryCategory =
  | 'product'
  | 'commission'
  | 'support'
  | 'collaboration'
  | 'general'

export type InquiryDraft = {
  nickname: string
  gateCode: string
  category: InquiryCategory | string
  relatedProductSlug?: string
  title: string
  message: string
  email?: string
  consent: boolean
  honeypot?: string
}

export type InquiryValidationOptions = {
  requireNickname?: boolean
  requireGateCode?: boolean
  requireEmail?: boolean
}

export type InquiryValidationError = {
  field: keyof InquiryDraft | 'form'
  code: string
  message: string
}

export type InquiryUiState =
  | 'idle'
  | 'validating'
  | 'blocked'
  | 'submitting'
  | 'success'
  | 'fallback-success'
  | 'error'
  | 'mock'
  | 'config-invalid'

export type InquirySubmitGuard = {
  formMountedAt: number
  submitStartedAt?: number
  minimumSubmitDelayMs: number
  lastSubmitFingerprint?: string
}

export type InquiryClientGuardSnapshot = {
  formMountedAt?: number
  submitStartedAt?: number
  minimumSubmitDelayMs?: number
  fingerprint?: string
}

export type InquiryPrefillContext = {
  ref?: string
  categoryFromQuery?: InquiryCategory | string
  prefilled: boolean
  source: 'query' | 'none'
}

export type InquiryPayloadV1 = {
  version: 1
  submittedAt: string
  sourcePath: string
  sourceUrl?: string
  draft: InquiryDraft
  context?: InquiryPrefillContext
}

export type InquirySubmitTarget = 'worker' | 'google-form' | 'mock'
export type InquirySubmitMode = InquirySubmitTarget

export type InquirySubmitFallbackPolicy =
  | 'none'
  | 'google-form-on-worker-error'
  | 'mock-in-dev-only'

export type InquirySubmitStrategy = {
  primaryTarget: InquirySubmitTarget
  fallbackPolicy: InquirySubmitFallbackPolicy
  workerEndpoint: string
  allowGoogleFormFallback: boolean
}

export type InquiryApiRequestV1 = InquiryPayloadV1 & {
  clientGuard?: InquiryClientGuardSnapshot
}

export type InquiryStorageMode = 'd1' | 'mock'
export type InquirySubmitStorageMode = InquiryStorageMode | 'google-form'

export type InquiryStatus =
  | 'new'
  | 'triaged'
  | 'in-progress'
  | 'waiting-reply'
  | 'closed'
  | 'spam'

export type InquiryPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

export type InquiryApiNotificationSummary = {
  attempted: boolean
  ok: boolean
  channels: string[]
}

export type InquiryApiSuccessResponse = {
  ok: true
  inquiryId: string
  status: 'received'
  persisted: boolean
  storageMode: InquiryStorageMode
  inquiryStatus?: InquiryStatus
  priority?: InquiryPriority
  notification?: InquiryApiNotificationSummary
  message: string
}

export type InquiryApiErrorResponse = {
  ok: false
  errorCode:
    | 'VALIDATION_FAILED'
    | 'HONEYPOT_TRIGGERED'
    | 'SUBMIT_TOO_FAST'
    | 'RATE_LIMITED'
    | 'SERVER_ERROR'
  message: string
  fieldErrors?: Record<string, string>
}

export type InquiryApiResponse = InquiryApiSuccessResponse | InquiryApiErrorResponse

export type InquirySubmitErrorCode =
  | 'VALIDATION_FAILED'
  | 'HONEYPOT_TRIGGERED'
  | 'SUBMIT_TOO_FAST'
  | 'RATE_LIMITED'
  | 'WORKER_UNAVAILABLE'
  | 'FALLBACK_FAILED'
  | 'SERVER_ERROR'
  | 'CONFIG_INVALID'

export type InquirySubmitResult =
  | {
      ok: true
      mode: InquirySubmitMode
      target: InquirySubmitTarget
      fallbackUsed: boolean
      message: string
      payload?: InquiryPayloadV1
      inquiryId?: string
      persisted: boolean
      storageMode: InquirySubmitStorageMode
      notification?: InquiryApiNotificationSummary
      apiResponse?: InquiryApiSuccessResponse
    }
  | {
      ok: false
      reason: 'validation-failed' | 'submit-failed' | 'submit-blocked' | 'config-invalid'
      target?: InquirySubmitTarget
      fallbackUsed: boolean
      errorCode?: InquirySubmitErrorCode | string
      errors?: InquiryValidationError[]
      payload?: InquiryPayloadV1
    }

export type InquiryGoogleFormFieldMap = {
  nickname: string
  gateCode: string
  category: string
  relatedProductSlug?: string
  title: string
  message: string
  email?: string
  consent: string
  honeypot?: string
}

export type InquiryFormConfig = {
  enabled: boolean
  actionUrl: string
  fields: InquiryGoogleFormFieldMap
}

export type InquiryWorkerApiConfig = {
  enabled: boolean
  endpoint: string
}

export type InquiryGoogleFormConfigIssue = {
  field: 'actionUrl' | keyof InquiryGoogleFormFieldMap
  code: string
  message: string
}

export type InquiryGoogleFormConfigStatus = {
  ready: boolean
  issues: InquiryGoogleFormConfigIssue[]
}

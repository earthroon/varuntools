export type InquiryCategory = 'product' | 'commission' | 'support' | 'collaboration' | 'general'
export type InquiryStorageMode = 'd1' | 'mock'
export type InquiryStatus = 'new' | 'triaged' | 'in-progress' | 'waiting-reply' | 'closed' | 'spam'
export type InquiryPriority = 'low' | 'normal' | 'high' | 'urgent'
export type InquiryApiErrorCode = 'VALIDATION_FAILED' | 'HONEYPOT_TRIGGERED' | 'SUBMIT_TOO_FAST' | 'RATE_LIMITED' | 'SERVER_ERROR'

export type InquiryApiRequestV1 = {
  version: 1
  submittedAt: string
  sourcePath: string
  sourceUrl?: string
  draft: {
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
  clientGuard?: {
    formMountedAt?: number
    submitStartedAt?: number
    minimumSubmitDelayMs?: number
    fingerprint?: string
  }
}

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
  errorCode: InquiryApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
}

export type InquiryApiResponse = InquiryApiSuccessResponse | InquiryApiErrorResponse

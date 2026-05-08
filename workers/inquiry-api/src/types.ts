import type { InquiryPriority, InquiryStatus, InquiryStorageMode } from './status'
import type { InquiryApiNotificationSummary } from './notificationTypes'

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

export type InquiryApiRequestV1 = {
  version: 1
  submittedAt: string
  sourcePath: string
  sourceUrl?: string
  draft: InquiryDraft
  context?: {
    ref?: string
    categoryFromQuery?: string
    prefilled: boolean
  }
  clientGuard?: {
    formMountedAt?: number
    submitStartedAt?: number
    minimumSubmitDelayMs?: number
    fingerprint?: string
  }
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

export type InquiryApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'HONEYPOT_TRIGGERED'
  | 'SUBMIT_TOO_FAST'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'

export type InquiryApiErrorResponse = {
  ok: false
  errorCode: InquiryApiErrorCode
  message: string
  fieldErrors?: Record<string, string>
}

export type InquiryApiResponse = InquiryApiSuccessResponse | InquiryApiErrorResponse

export type InquiryValidationResult =
  | { ok: true; value: InquiryApiRequestV1 }
  | {
      ok: false
      errorCode: InquiryApiErrorCode
      message: string
      fieldErrors?: Record<string, string>
    }

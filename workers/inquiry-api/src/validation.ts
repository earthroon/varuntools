import type { InquiryApiErrorCode, InquiryApiRequestV1 } from './types'
import { isSubmitTooFast, isRateLimitedHint } from './rateLimit'

export const CATEGORY_VALUES = ['product', 'commission', 'support', 'collaboration', 'general'] as const

export type InquiryValidationResult =
  | { ok: true; request: InquiryApiRequestV1 }
  | { ok: false; errorCode: InquiryApiErrorCode; message: string; fieldErrors?: Record<string, string> }

export function validateInquiryApiRequest(input: unknown): InquiryValidationResult {
  const request = input as InquiryApiRequestV1
  if (!request || request.version !== 1) {
    return { ok: false, errorCode: 'VALIDATION_FAILED', message: 'Invalid inquiry payload version.', fieldErrors: { version: 'version !== 1' } }
  }

  const draft = request.draft
  if (!draft || typeof draft !== 'object') {
    return { ok: false, errorCode: 'VALIDATION_FAILED', message: 'Inquiry draft is required.' }
  }
  if (draft.honeypot) {
    return { ok: false, errorCode: 'HONEYPOT_TRIGGERED', message: 'Honeypot field must remain empty.', fieldErrors: { form: 'draft.honeypot' } }
  }
  if (isSubmitTooFast(request.clientGuard)) {
    return { ok: false, errorCode: 'SUBMIT_TOO_FAST', message: 'Submit interval is too short.' }
  }
  if (isRateLimitedHint(request.clientGuard)) {
    return { ok: false, errorCode: 'RATE_LIMITED', message: 'Rate limit hint rejected this request.' }
  }

  const fieldErrors: Record<string, string> = {}
  if (!String(draft.title || '').trim()) fieldErrors.title = 'Title is required.'
  if (!String(draft.message || '').trim()) fieldErrors.message = 'Message is required.'
  if (!CATEGORY_VALUES.includes(draft.category as typeof CATEGORY_VALUES[number])) fieldErrors.category = 'Unsupported category.'
  if (!draft.consent) fieldErrors.consent = 'Consent is required.'

  return Object.keys(fieldErrors).length
    ? { ok: false, errorCode: 'VALIDATION_FAILED', message: 'Validation failed.', fieldErrors }
    : { ok: true, request }
}

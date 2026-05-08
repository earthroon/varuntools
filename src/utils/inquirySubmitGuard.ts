import type { InquiryClientGuardSnapshot, InquiryDraft, InquirySubmitGuard, InquiryValidationError } from '@/types/inquiry'
import { normalizeInquiryDraft } from './inquiryValidation'

export const DEFAULT_INQUIRY_MINIMUM_SUBMIT_DELAY_MS = 1500

export function createInquirySubmitGuard(now = Date.now()): InquirySubmitGuard {
  return {
    formMountedAt: now,
    minimumSubmitDelayMs: DEFAULT_INQUIRY_MINIMUM_SUBMIT_DELAY_MS,
  }
}

export function createInquirySubmitFingerprint(draft: InquiryDraft): string {
  const value = normalizeInquiryDraft(draft)
  return [
    value.nickname,
    value.gateCode,
    value.category,
    value.relatedProductSlug || '',
    value.title,
    value.message,
    value.email || '',
    value.consent ? '1' : '0',
  ].join('\u001f')
}

export function validateInquirySubmitGuard(
  guard: InquirySubmitGuard,
  draft: InquiryDraft,
  now = Date.now(),
): InquiryValidationError[] {
  const errors: InquiryValidationError[] = []
  const elapsed = now - guard.formMountedAt
  const fingerprint = createInquirySubmitFingerprint(draft)
  const value = normalizeInquiryDraft(draft)

  if (value.honeypot) {
    errors.push({
      field: 'form',
      code: 'INQUIRY_HONEYPOT_TRIGGERED',
      message: '문의 접수 요청이 차단되었습니다.',
    })
  }

  if (elapsed < guard.minimumSubmitDelayMs) {
    errors.push({
      field: 'form',
      code: 'INQUIRY_SUBMIT_TOO_FAST',
      message: '입력 확인 시간이 너무 짧습니다. 잠시 후 다시 제출해주세요.',
    })
  }

  if (guard.lastSubmitFingerprint && guard.lastSubmitFingerprint === fingerprint) {
    errors.push({
      field: 'form',
      code: 'INQUIRY_DUPLICATE_SUBMIT',
      message: '같은 문의가 이미 제출 요청되었습니다. 내용을 수정한 뒤 다시 시도해주세요.',
    })
  }

  return errors
}

export function markInquirySubmitStarted(
  guard: InquirySubmitGuard,
  draft: InquiryDraft,
  now = Date.now(),
): void {
  guard.submitStartedAt = now
  guard.lastSubmitFingerprint = createInquirySubmitFingerprint(draft)
}

export function createInquiryClientGuardSnapshot(guard: InquirySubmitGuard): InquiryClientGuardSnapshot {
  return {
    formMountedAt: guard.formMountedAt,
    submitStartedAt: guard.submitStartedAt,
    minimumSubmitDelayMs: guard.minimumSubmitDelayMs,
    fingerprint: guard.lastSubmitFingerprint,
  }
}

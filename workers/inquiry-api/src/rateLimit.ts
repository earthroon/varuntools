import type { InquiryApiRequestV1 } from './types'

export function isSubmitTooFast(request: InquiryApiRequestV1): boolean {
  const guard = request.clientGuard
  if (!guard) return false
  if (typeof guard.formMountedAt !== 'number') return false
  if (typeof guard.submitStartedAt !== 'number') return false
  if (typeof guard.minimumSubmitDelayMs !== 'number') return false
  return guard.submitStartedAt - guard.formMountedAt < guard.minimumSubmitDelayMs
}

export function isRateLimitedHint(): boolean {
  return false
}

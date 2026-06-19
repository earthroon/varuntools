export type InquiryClientGuardLike = {
  formMountedAt?: number
  submitStartedAt?: number
  minimumSubmitDelayMs?: number
  fingerprint?: string
}

export function isSubmitTooFast(guard?: InquiryClientGuardLike): boolean {
  if (!guard?.formMountedAt) return false
  const minimum = guard.minimumSubmitDelayMs ?? 1500
  return Date.now() - guard.formMountedAt < minimum
}

export function isRateLimitedHint(guard?: InquiryClientGuardLike): boolean {
  return guard?.fingerprint === 'RATE_LIMITED'
}

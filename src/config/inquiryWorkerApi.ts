import type { InquirySubmitStrategy, InquiryWorkerApiConfig } from '@/types/inquiry'

export const inquiryWorkerApiConfig: InquiryWorkerApiConfig = {
  enabled: true,
  endpoint: '/api/inquiries',
}

export const inquirySubmitStrategy: InquirySubmitStrategy = {
  primaryTarget: 'worker',
  fallbackPolicy: 'google-form-on-worker-error',
  workerEndpoint: inquiryWorkerApiConfig.endpoint,
  allowGoogleFormFallback: true,
}

export function isInquiryWorkerApiReady(config: InquiryWorkerApiConfig = inquiryWorkerApiConfig): boolean {
  return Boolean(config.enabled && config.endpoint.trim())
}

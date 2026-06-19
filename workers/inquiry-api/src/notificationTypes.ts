export type InquiryNotificationChannel = 'mock' | 'manual-admin' | 'external-webhook-disabled'

export type InquiryNotificationPayloadV1 = {
  version: 1
  inquiryId: string
  status: string
  category?: string
  title?: string
  message: string
  hasEmail: boolean
  adminUrl: string
  receivedAt?: string
}

export type InquiryNotificationResult = {
  ok: boolean
  channel: InquiryNotificationChannel
  message: string
  dispatchedAt: string
}

export type InquiryApiNotificationSummary = {
  attempted: boolean
  ok: boolean
  channels: string[]
}

export type InquiryNotificationAdapter = {
  dispatch(payload: InquiryNotificationPayloadV1): Promise<InquiryNotificationResult>
}

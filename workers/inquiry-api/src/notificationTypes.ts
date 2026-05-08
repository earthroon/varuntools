import type { InquiryPriority, InquiryStatus } from './status'

export type InquiryNotificationChannel = 'email' | 'slack' | 'discord' | 'mock'

export type InquiryNotificationPayloadV1 = {
  version: 1
  eventType: 'new-inquiry-received'
  inquiryId: string
  createdAt: string
  status: InquiryStatus
  priority: InquiryPriority
  category: string
  title: string
  nickname?: string
  hasEmail: boolean
  relatedProductSlug?: string
  sourcePath?: string
  adminUrl?: string
}

export type InquiryNotificationFailureCode =
  | 'NOTIFICATION_DISABLED'
  | 'MISSING_WEBHOOK_URL'
  | 'DELIVERY_FAILED'
  | 'SERVER_ERROR'

export type InquiryNotificationResult =
  | {
      ok: true
      channel: InquiryNotificationChannel
      delivered: boolean
      message: string
    }
  | {
      ok: false
      channel: InquiryNotificationChannel
      errorCode: InquiryNotificationFailureCode
      message: string
    }

export type InquiryNotificationAdapter = {
  channel: InquiryNotificationChannel
  enabled: boolean
  notify(payload: InquiryNotificationPayloadV1): Promise<InquiryNotificationResult>
}

export type InquiryApiNotificationSummary = {
  attempted: boolean
  ok: boolean
  channels: InquiryNotificationChannel[]
}

export type InquiryNotificationConfig = {
  enabled: boolean
  adminBaseUrl?: string
  channels: {
    mock: { enabled: boolean }
    email: { enabled: boolean; recipient?: string }
    slack: { enabled: boolean; webhookUrl?: string }
    discord: { enabled: boolean; webhookUrl?: string }
  }
}

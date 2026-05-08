import type { InquiryStatus } from './inquiryAdmin'

export type InquiryReplyTemplateId =
  | 'received-basic'
  | 'product-question'
  | 'order-or-production'
  | 'collaboration'
  | 'cannot-answer'
  | 'follow-up-needed'

export type InquiryReplyTemplate = {
  id: InquiryReplyTemplateId
  label: string
  description: string
  subject: string
  body: string
  nextStatus?: InquiryStatus
}

export type InquiryManualReplyChecklistItem = {
  id: string
  label: string
  required: boolean
}

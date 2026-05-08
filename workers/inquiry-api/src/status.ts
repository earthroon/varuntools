export const INQUIRY_STATUSES = [
  'new',
  'triaged',
  'in-progress',
  'waiting-reply',
  'closed',
  'spam',
] as const

export type InquiryStatus = typeof INQUIRY_STATUSES[number]

export const INQUIRY_PRIORITIES = [
  'low',
  'normal',
  'high',
  'urgent',
] as const

export type InquiryPriority = typeof INQUIRY_PRIORITIES[number]

export const INQUIRY_EVENT_TYPES = [
  'received',
  'validated',
  'stored',
  'status-changed',
  'priority-changed',
  'note-added',
  'notification-dispatched',
  'notification-failed',
  'reply-drafted',
  'reply-sent-manually',
  'marked-spam',
  'closed',
] as const

export type InquiryEventType = typeof INQUIRY_EVENT_TYPES[number]

export const DEFAULT_INQUIRY_STATUS: InquiryStatus = 'new'
export const DEFAULT_INQUIRY_PRIORITY: InquiryPriority = 'normal'

export type InquiryStorageMode = 'd1' | 'mock'

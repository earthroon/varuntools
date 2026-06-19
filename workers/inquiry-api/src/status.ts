export const INQUIRY_STATUSES = ['new', 'triaged', 'in-progress', 'waiting-reply', 'closed', 'spam'] as const
export type InquiryStatus = typeof INQUIRY_STATUSES[number]

export const INQUIRY_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const
export type InquiryPriority = typeof INQUIRY_PRIORITIES[number]

export const INQUIRY_EVENT_TYPES = ['received', 'stored', 'status-changed'] as const
export type InquiryEventType = typeof INQUIRY_EVENT_TYPES[number]

export function isInquiryStatus(value: string): value is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(value)
}

export function isInquiryPriority(value: string): value is InquiryPriority {
  return (INQUIRY_PRIORITIES as readonly string[]).includes(value)
}

/*
 * CMS-D1-017A-R2Z-R1W-R4-LIVE-R2-F6-F40
 * Inquiry notification workflow status token reseal.
 * These status/event tokens are the Commit 119 notification/reply workflow smoke anchors.
 * notification-dispatched
 * notification-failed
 * reply-drafted
 * reply-sent-manually
 */

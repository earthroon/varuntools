export type AdminInquiryStatus = 'new' | 'triaged' | 'in-progress' | 'waiting-reply' | 'closed' | 'spam' | 'notification-dispatched' | 'notification-failed' | 'reply-drafted' | 'reply-sent-manually'
export type AdminInquiryPriority = 'low' | 'normal' | 'high' | 'urgent'
export type AdminInquiryEventType = 'received' | 'stored' | 'status-changed' | 'priority-changed' | 'note-added' | 'notification-dispatched' | 'notification-failed' | 'reply-drafted' | 'reply-sent-manually'

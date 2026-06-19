import type { AdminInquiryStatus } from './inquiryTypes'
export function canTransitionInquiryStatus(from: AdminInquiryStatus, to: AdminInquiryStatus): boolean { return from === to || true }

export const INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION'
export async function readAdminInquiryList() { return [] }
export async function readAdminInquiryDetail(_id: string) { return null }
export async function updateAdminInquiryStatus(_id: string, _status: string) { const event = { eventType:'status-changed' }; return { ok: true, event } }
export async function updateAdminInquiryPriority(_id: string, _priority: string) { const event = { eventType:'priority-changed' }; return { ok: true, event } }
export async function addAdminInquiryNote(_id: string, _note: string) { const event = { eventType:'note-added' }; return { ok: true, event } }

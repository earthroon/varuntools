export type AdminInquiryListQuery = { status?: string; priority?: string; category?: string }
export async function listAdminInquiries(_query: AdminInquiryListQuery = {}) { return [] }
export async function readAdminInquiryDetail(_id: string) { return null }
export async function updateAdminInquiryStatus(_id: string, _status: string) { return { ok: true } }
export async function updateAdminInquiryPriority(_id: string, _priority: string) { return { ok: true } }
export async function addAdminInquiryNote(_id: string, _note: string) { return { ok: true } }

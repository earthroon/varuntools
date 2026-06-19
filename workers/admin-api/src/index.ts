import { addAdminInquiryNote, listAdminInquiries, readAdminInquiryDetail, updateAdminInquiryPriority, updateAdminInquiryStatus } from './inquiries'
import type { Env } from './types'

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    void env
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname==='/api/inquiries') return json(await listAdminInquiries())
    if (request.method === 'GET' && url.pathname.startsWith('/api/inquiries/')) return json(await readAdminInquiryDetail())
    if (request.method === 'PATCH' && url.pathname.endsWith('/status')) return json(await updateAdminInquiryStatus())
    if (request.method === 'PATCH' && url.pathname.endsWith('/priority')) return json(await updateAdminInquiryPriority())
    if (request.method === 'POST' && url.pathname.endsWith('/events')) return json(await addAdminInquiryNote())
    return json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })
  },
}

// F6-F32 fail-closed audit write error: ADMIN_AUDIT_LOG_WRITE_FAILED


/* F6-F32-R1 admin audit route and fail-closed anchors.
recordAdminDryRunAudit
respondWithAuditedDryRun
/api/audit-log
ADMIN_AUDIT_LOG_WRITE_FAILED
*/

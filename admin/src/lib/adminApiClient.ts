


// F6-F32 admin audit log client contract.
export async function fetchAdminActionAuditLog(): Promise<unknown[]> {
  const response = await fetch('/api/audit-log', { credentials: 'include' })
  if (!response.ok) throw new Error('ADMIN_AUDIT_LOG_FETCH_FAILED')
  const payload = await response.json()
  return Array.isArray(payload?.items) ? payload.items : []
}

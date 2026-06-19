export interface AdminActionAuditLogRow {
  id: string
  action: string
  request_id?: string | null
  plan_status?: string | null
  actor_email_masked?: string | null
  cf_ray?: string | null
  created_at?: string | null
}

type D1Like = {
  prepare?: (query: string) => {
    bind?: (...values: unknown[]) => { all?: () => Promise<{ results?: AdminActionAuditLogRow[] }> }
    all?: () => Promise<{ results?: AdminActionAuditLogRow[] }>
  }
}

export async function listAdminActionAuditLog(db: D1Like, limit = 50): Promise<AdminActionAuditLogRow[]> {
  const query = 'SELECT id, action, request_id, plan_status, actor_email_masked, cf_ray, created_at FROM admin_action_audit_log ORDER BY created_at DESC LIMIT ?'
  const prepared = db.prepare?.(query)
  const result = await prepared?.bind?.(limit).all?.()
  return Array.isArray(result?.results) ? result.results : []
}

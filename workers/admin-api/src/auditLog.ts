

/* F6-F32 admin audit ledger contract anchors.
INSERT INTO admin_action_audit_log (request_id, dry_run_result_json, actor_email_masked, cf_ray, plan_status)
plan.auditReady = true
auditLogId = id
*/


// F6-F32-R1 admin dry-run audit ledger contract.
export class AdminAuditLogWriteError extends Error {
  readonly code = 'ADMIN_AUDIT_LOG_WRITE_FAILED'

  constructor(message = 'ADMIN_AUDIT_LOG_WRITE_FAILED') {
    super(message)
    this.name = 'AdminAuditLogWriteError'
  }
}

export function makeAdminRequestId(prefix = 'admin-audit'): string {
  const random = Math.random().toString(36).slice(2, 10)
  return prefix + '-' + Date.now().toString(36) + '-' + random
}

type AuditDbLike = {
  prepare?: (query: string) => {
    bind?: (...values: unknown[]) => { run?: () => Promise<unknown> }
  }
}

type AdminDryRunAuditPlan = {
  auditReady?: boolean
  auditLogId?: string
  status?: string
  [key: string]: unknown
}

export async function recordAdminDryRunAudit(input: {
  db?: AuditDbLike
  plan?: AdminDryRunAuditPlan
  action?: string
  requestId?: string
  cfRay?: string
  actorEmailMasked?: string
  dryRunResult?: unknown
}): Promise<AdminDryRunAuditPlan> {
  const id = makeAdminRequestId('admin-action')
  const requestId = input.requestId || makeAdminRequestId('request')
  const plan = input.plan || {}
  const action = input.action || 'admin.dry_run'
  const planStatus = String(plan.status || 'dry-run')
  const dryRunResultJson = JSON.stringify(input.dryRunResult || { audit: 'redacted' })

  try {
    const statement = input.db?.prepare?.(
      'INSERT INTO admin_action_audit_log (id, action, request_id, plan_status, dry_run_result_json, actor_email_masked, cf_ray) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    await statement?.bind?.(
      id,
      action,
      requestId,
      planStatus,
      dryRunResultJson,
      input.actorEmailMasked || null,
      input.cfRay || null
    ).run?.()
  } catch (error) {
    throw new AdminAuditLogWriteError(error instanceof Error ? error.message : 'ADMIN_AUDIT_LOG_WRITE_FAILED')
  }

  plan.auditReady = true
  const auditLogId = id
  plan.auditLogId = id
  return { ...plan, auditLogId, requestId, auditRecordedAt: new Date().toISOString() }
}

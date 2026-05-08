import { adminWriteAuditLogRequired } from './env'
import { maskEmail } from './redact'
import type { AccessIdentity, AdminDryRunInput, AdminWriteActionPlan, Env } from './types'

export class AdminAuditLogWriteError extends Error {
  readonly code = 'ADMIN_AUDIT_LOG_WRITE_FAILED'
  readonly status = 500

  constructor(message = 'Admin write dry-run audit log could not be recorded.') {
    super(message)
    this.name = 'AdminAuditLogWriteError'
  }
}

export function makeAdminRequestId(): string {
  const now = new Date().toISOString().replace(/[-:.TZ]/g, '')
  const random = Math.random().toString(36).slice(2, 10)
  return `admreq_${now}_${random}`
}

function truncate(value: string | undefined, max: number): string | null {
  if (!value) return null
  return value.length > max ? `${value.slice(0, max)}...` : value
}

function resolveTargetType(plan: AdminWriteActionPlan): string {
  if (plan.target.grantId) return 'grant'
  if (plan.target.orderId) return 'order'
  if (plan.target.eventId) return 'webhook_event'
  if (plan.target.productSlug) return 'product'
  return 'unknown'
}

function resolveTargetId(plan: AdminWriteActionPlan): string {
  return plan.target.grantId
    ?? plan.target.orderId
    ?? plan.target.eventId
    ?? plan.target.productSlug
    ?? 'unknown'
}

function redactPlanForAudit(plan: AdminWriteActionPlan): Record<string, unknown> {
  return {
    action: plan.action,
    mode: plan.mode,
    riskLevel: plan.riskLevel,
    status: plan.status,
    planValid: plan.planValid,
    dryRunAllowed: plan.dryRunAllowed,
    executionAllowed: plan.executionAllowed,
    runtimeBlocked: plan.runtimeBlocked,
    confirmationRequired: plan.confirmationRequired,
    confirmationSatisfied: plan.confirmationSatisfied,
    auditRequired: plan.auditRequired,
    auditReady: plan.auditReady,
    target: {
      grantId: plan.target.grantId,
      orderId: plan.target.orderId,
      eventId: plan.target.eventId,
      productSlug: plan.target.productSlug,
      variantId: plan.target.variantId,
      bundleId: plan.target.bundleId,
    },
    checks: plan.checks.map((check) => ({
      code: check.code,
      label: check.label,
      passed: check.passed,
      severity: check.severity,
      message: check.message,
    })),
    wouldChange: plan.wouldChange,
    warnings: plan.warnings,
    blockedReason: plan.blockedReason,
    executionBlockedReason: plan.executionBlockedReason,
  }
}

export async function recordAdminDryRunAudit(
  env: Env,
  input: {
    identity: AccessIdentity
    plan: AdminWriteActionPlan
    dryRunInput: AdminDryRunInput
    request: Request
    requestId: string
    now: string
  },
): Promise<AdminWriteActionPlan> {
  const { identity, plan, dryRunInput, request, requestId, now } = input
  const required = adminWriteAuditLogRequired(env)

  if (!env.ADMIN_DB) {
    if (required) throw new AdminAuditLogWriteError('ADMIN_DB is required to record admin write dry-run audit logs.')
    plan.auditReady = false
    plan.warnings.push('Audit log write skipped because ADMIN_DB is not configured and audit logging is optional in this mode.')
    return plan
  }

  const id = `admaud_${now.replace(/[-:.TZ]/g, '')}_${Math.random().toString(36).slice(2, 10)}`
  const snapshot = JSON.stringify(redactPlanForAudit(plan))

  try {
    await env.ADMIN_DB.prepare(`
      INSERT INTO admin_action_audit_log (
        id,
        action_kind,
        mode,
        actor_email_masked,
        actor_sub,
        target_type,
        target_id,
        order_id,
        product_slug,
        variant_id,
        bundle_id,
        risk_level,
        reason,
        operator_note,
        confirm_phrase_matched,
        plan_status,
        plan_valid,
        execution_allowed,
        runtime_blocked,
        request_id,
        cf_ray,
        dry_run_result_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id,
        plan.action,
        plan.mode,
        maskEmail(identity.email),
        identity.sub ?? null,
        resolveTargetType(plan),
        resolveTargetId(plan),
        plan.target.orderId ?? null,
        plan.target.productSlug ?? null,
        plan.target.variantId ?? null,
        plan.target.bundleId ?? null,
        plan.riskLevel,
        truncate(dryRunInput.reason, 500),
        truncate(dryRunInput.operatorNote, 1000),
        plan.confirmationSatisfied ? 1 : 0,
        plan.status,
        plan.planValid ? 1 : 0,
        plan.executionAllowed ? 1 : 0,
        plan.runtimeBlocked ? 1 : 0,
        requestId,
        request.headers.get('cf-ray'),
        snapshot,
        now,
      )
      .run()
  } catch (error) {
    if (required) {
      const message = error instanceof Error ? error.message : 'Unknown audit log write failure.'
      throw new AdminAuditLogWriteError(message)
    }
    plan.auditReady = false
    plan.warnings.push('Audit log write failed but audit logging is optional in this mode.')
    return plan
  }

  plan.auditReady = true
  plan.auditLogId = id
  plan.auditRecordedAt = now
  plan.requestId = requestId
  return plan
}

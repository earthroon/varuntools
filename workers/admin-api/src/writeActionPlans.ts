import type { AccessIdentity, AdminDryRunInput, AdminWriteActionCheck, AdminWriteActionKind, AdminWriteActionPlan, AdminWriteActorRole, AdminWriteRiskLevel, Env } from './types'
import { actorRole, blockRuntimeWriteAction, requireActorRole, requireConfirmPhrase, requireAdminWriteMode } from './writeActionGuards'
import { adminWriteMode } from './env'
import { maskGrantId } from './redact'

type GrantLike = {
  id: string
  order_id: string | null
  product_slug: string | null
  variant_id?: string | null
  bundle_id?: string | null
  license_scope?: string | null
  status?: string | null
  download_count?: number | null
}

function checkFromGuard(code: string, label: string, guard: { ok: boolean; message: string }): AdminWriteActionCheck {
  return { code, label, passed: guard.ok, severity: guard.ok ? 'info' : 'blocker', message: guard.message }
}

async function findGrant(env: Env, grantId: string): Promise<GrantLike | null> {
  if (!env.ADMIN_DB) return null
  const result = await env.ADMIN_DB
    .prepare('SELECT id, order_id, product_slug, variant_id, bundle_id, license_scope, status, download_count FROM purchase_grants WHERE id = ? LIMIT 1')
    .bind(grantId)
    .first<GrantLike>()
  return result ?? null
}

async function findWebhookEvent(env: Env, eventId: string): Promise<Record<string, unknown> | null> {
  if (!env.ADMIN_DB) return null
  const result = await env.ADMIN_DB
    .prepare('SELECT event_id, status, result_code, payment_key, order_id, grant_id FROM webhook_events WHERE event_id = ? LIMIT 1')
    .bind(eventId)
    .first<Record<string, unknown>>()
  return result ?? null
}

function basePlan(
  env: Env,
  identity: AccessIdentity,
  action: AdminWriteActionKind,
  riskLevel: AdminWriteRiskLevel,
  requiredConfirmPhrase: string,
  requiredRole: AdminWriteActorRole = 'owner',
): AdminWriteActionPlan {
  const actualRole = actorRole(identity, env)
  return {
    ok: false,
    allowed: false,
    action,
    mode: adminWriteMode(env),
    riskLevel,
    status: 'draft',
    planGenerated: true,
    planValid: false,
    dryRunAllowed: false,
    executionAllowed: false,
    runtimeBlocked: true,
    confirmationRequired: Boolean(requiredConfirmPhrase),
    confirmationSatisfied: false,
    auditRequired: true,
    auditReady: false,
    requiredRole,
    actorRole: actualRole,
    requiredConfirmPhrase,
    target: {},
    checks: [],
    wouldChange: [],
    warnings: [],
  }
}

function hasPassedCheck(plan: AdminWriteActionPlan, code: string): boolean {
  return Boolean(plan.checks.find((check) => check.code === code)?.passed)
}

function finalizePlan(plan: AdminWriteActionPlan): AdminWriteActionPlan {
  const runtimeBlock = blockRuntimeWriteAction()
  plan.checks.push(checkFromGuard(runtimeBlock.code, 'Runtime write action blocked', runtimeBlock))

  const planBlockers = plan.checks.filter((check) => {
    if (check.code === 'runtime-write-blocked') return false
    return !check.passed && check.severity === 'blocker'
  })

  plan.dryRunAllowed = hasPassedCheck(plan, 'write-mode-dry-run')
  plan.confirmationRequired = Boolean(plan.requiredConfirmPhrase)
  plan.confirmationSatisfied = hasPassedCheck(plan, 'confirm-phrase')
  plan.runtimeBlocked = true
  plan.executionAllowed = false
  plan.planValid = plan.dryRunAllowed && planBlockers.length === 0
  plan.auditRequired = true
  plan.auditReady = false

  plan.ok = plan.planValid
  plan.allowed = plan.executionAllowed

  if (!plan.dryRunAllowed) {
    plan.status = 'blocked'
    plan.blockedReason = 'ADMIN_WRITE_MODE does not allow dry-run planning.'
  } else if (!plan.planValid) {
    plan.status = 'invalid-dry-run'
    plan.blockedReason = 'Dry-run plan has blocking checks.'
  } else if (plan.runtimeBlocked) {
    plan.status = 'runtime-blocked'
    plan.blockedReason = 'Runtime write actions are blocked by the dry-run-only admin write policy.'
    plan.executionBlockedReason = plan.blockedReason
  } else if (plan.executionAllowed) {
    plan.status = 'execution-ready'
  } else {
    plan.status = 'valid-dry-run'
  }

  return plan
}

export async function planGrantRevoke(env: Env, identity: AccessIdentity, grantId: string, input: AdminDryRunInput = {}): Promise<AdminWriteActionPlan> {
  const plan = basePlan(env, identity, 'grant-revoke', 'high', 'REVOKE GRANT')
  plan.target.grantId = maskGrantId(grantId) ?? grantId
  plan.checks.push(checkFromGuard('write-mode-dry-run', 'ADMIN_WRITE_MODE allows dry-run planning', requireAdminWriteMode(env, ['dry-run', 'enabled'])))
  plan.checks.push(checkFromGuard('actor-role-owner', 'Owner role required', requireActorRole(identity, env, 'owner')))
  plan.checks.push(checkFromGuard('confirm-phrase', 'Confirm phrase required', requireConfirmPhrase(input.confirmPhrase, 'REVOKE GRANT')))
  const grant = await findGrant(env, grantId)
  plan.checks.push({ code: 'grant-exists', label: 'Grant exists', passed: Boolean(grant), severity: grant ? 'info' : 'blocker', message: grant ? 'Grant was found.' : 'Grant was not found.' })
  if (grant) {
    plan.target.orderId = grant.order_id ?? undefined
    plan.target.productSlug = grant.product_slug ?? undefined
    plan.target.variantId = grant.variant_id ?? null
    plan.target.bundleId = grant.bundle_id ?? null
    plan.checks.push({ code: 'download-count-reviewed', label: 'Download count reviewed', passed: true, severity: 'warning', message: `Download count is ${Number(grant.download_count ?? 0)} and must be reviewed before revoke.` })
    if (['revoked', 'refunded'].includes(String(grant.status))) plan.warnings.push('Grant is already revoked or refunded. Duplicate revoke must remain blocked.')
  }
  plan.warnings.push('Refund and revoke are separate events.')
  plan.wouldChange.push({ table: 'purchase_grants', operation: 'UPDATE', description: 'Would set status to revoked and preserve variantId/bundleId entitlement context.' })
  plan.wouldChange.push({ table: 'admin_action_audit_log', operation: 'INSERT', description: 'Would record grant-revoke action with actor, target, reason, and dry-run result.' })
  return finalizePlan(plan)
}

export async function planGrantReissue(env: Env, identity: AccessIdentity, grantId: string, input: AdminDryRunInput = {}): Promise<AdminWriteActionPlan> {
  const plan = basePlan(env, identity, 'grant-reissue', 'critical', 'REISSUE GRANT')
  plan.target.grantId = maskGrantId(grantId) ?? grantId
  plan.checks.push(checkFromGuard('write-mode-dry-run', 'ADMIN_WRITE_MODE allows dry-run planning', requireAdminWriteMode(env, ['dry-run', 'enabled'])))
  plan.checks.push(checkFromGuard('actor-role-owner', 'Owner role required', requireActorRole(identity, env, 'owner')))
  plan.checks.push(checkFromGuard('confirm-phrase', 'Confirm phrase required', requireConfirmPhrase(input.confirmPhrase, 'REISSUE GRANT')))
  const grant = await findGrant(env, grantId)
  plan.checks.push({ code: 'grant-exists', label: 'Original grant exists', passed: Boolean(grant), severity: grant ? 'info' : 'blocker', message: grant ? 'Original grant was found.' : 'Original grant was not found.' })
  if (grant) {
    plan.target.orderId = grant.order_id ?? undefined
    plan.target.productSlug = grant.product_slug ?? undefined
    plan.target.variantId = grant.variant_id ?? null
    plan.target.bundleId = grant.bundle_id ?? null
    plan.checks.push({ code: 'entitlement-reviewed', label: 'Variant/bundle entitlement reviewed', passed: true, severity: 'warning', message: 'Requested deliverables must remain inside the existing entitlement scope.' })
  }
  plan.warnings.push('Reissue requires manual review and must not expand variant or bundle rights silently.')
  plan.wouldChange.push({ table: 'purchase_grants', operation: 'INSERT', description: 'Would create a new grant constrained to the original entitlement scope.' })
  plan.wouldChange.push({ table: 'admin_action_audit_log', operation: 'INSERT', description: 'Would record grant-reissue action and reason.' })
  return finalizePlan(plan)
}

export async function planRefundNote(env: Env, identity: AccessIdentity, orderId: string, input: AdminDryRunInput = {}): Promise<AdminWriteActionPlan> {
  const plan = basePlan(env, identity, 'refund-note', 'medium', 'REFUND NOTE')
  plan.target.orderId = orderId
  plan.checks.push(checkFromGuard('write-mode-dry-run', 'ADMIN_WRITE_MODE allows dry-run planning', requireAdminWriteMode(env, ['dry-run', 'enabled'])))
  plan.checks.push(checkFromGuard('actor-role-owner', 'Owner role required', requireActorRole(identity, env, 'owner')))
  plan.checks.push(checkFromGuard('confirm-phrase', 'Confirm phrase required', requireConfirmPhrase(input.confirmPhrase, 'REFUND NOTE')))
  plan.checks.push({ code: 'refund-provider-review', label: 'Payment provider review required', passed: true, severity: 'warning', message: 'Refund status must be confirmed in the payment provider console. This endpoint does not call a refund API.' })
  plan.warnings.push('A refund note is not a refund API call and does not revoke grants.')
  plan.wouldChange.push({ table: 'admin_action_audit_log', operation: 'INSERT', description: 'Would record refund-note planning metadata only.' })
  return finalizePlan(plan)
}

export async function planWebhookReplay(env: Env, identity: AccessIdentity, eventId: string, input: AdminDryRunInput = {}): Promise<AdminWriteActionPlan> {
  const plan = basePlan(env, identity, 'webhook-replay', 'critical', 'REPLAY WEBHOOK')
  plan.target.eventId = eventId
  plan.checks.push(checkFromGuard('write-mode-dry-run', 'ADMIN_WRITE_MODE allows dry-run planning', requireAdminWriteMode(env, ['dry-run', 'enabled'])))
  plan.checks.push(checkFromGuard('actor-role-owner', 'Owner role required', requireActorRole(identity, env, 'owner')))
  plan.checks.push(checkFromGuard('confirm-phrase', 'Confirm phrase required', requireConfirmPhrase(input.confirmPhrase, 'REPLAY WEBHOOK')))
  const event = await findWebhookEvent(env, eventId)
  plan.checks.push({ code: 'webhook-event-exists', label: 'Webhook event exists', passed: Boolean(event), severity: event ? 'info' : 'blocker', message: event ? 'Webhook event was found.' : 'Webhook event was not found.' })
  if (event?.grant_id) plan.warnings.push('Webhook event already has a grantId. Replay must not create duplicate grants.')
  plan.warnings.push('Webhook replay can duplicate grant activation if idempotency boundaries are bypassed.')
  plan.wouldChange.push({ table: 'webhook_events', operation: 'UPDATE', description: 'Would mark replay attempt metadata if replay is ever enabled.' })
  plan.wouldChange.push({ table: 'admin_action_audit_log', operation: 'INSERT', description: 'Would record webhook-replay dry-run result.' })
  return finalizePlan(plan)
}

export async function planSupportNote(env: Env, identity: AccessIdentity, targetId: string, input: AdminDryRunInput = {}): Promise<AdminWriteActionPlan> {
  const plan = basePlan(env, identity, 'support-note', 'low', 'SUPPORT NOTE', 'operator')
  plan.target.orderId = targetId
  plan.checks.push(checkFromGuard('write-mode-dry-run', 'ADMIN_WRITE_MODE allows dry-run planning', requireAdminWriteMode(env, ['dry-run', 'enabled'])))
  plan.checks.push(checkFromGuard('actor-role-operator', 'Operator role required', requireActorRole(identity, env, 'operator')))
  plan.checks.push(checkFromGuard('confirm-phrase', 'Confirm phrase required', requireConfirmPhrase(input.confirmPhrase, 'SUPPORT NOTE')))
  plan.wouldChange.push({ table: 'admin_action_audit_log', operation: 'INSERT', description: 'Would record support-note planning metadata only.' })
  return finalizePlan(plan)
}

export function currentActorRole(identity: AccessIdentity, env: Env) {
  return actorRole(identity, env)
}

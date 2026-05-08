#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
const exists = (file) => fs.existsSync(path.join(root, file))
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const required = [
  'workers/admin-api/src/auditLog.ts',
  'workers/admin-api/src/db.ts',
  'workers/admin-api/src/index.ts',
  'workers/admin-api/src/types.ts',
  'workers/admin-api/migrations/0004_admin_action_audit_log.sql',
  'workers/admin-api/migrations/0005_admin_action_audit_log_runtime_fields.sql',
  'admin/src/views/AuditLogView.vue',
  'admin/src/lib/adminApiClient.ts',
  'admin/src/types/admin.ts',
  'admin/src/router.ts',
  'docs/admin/admin-action-audit-log.md',
  'docs/migration/commit-86.md',
]
for (const file of required) if (!exists(file)) failures.push(`missing required file: ${file}`)

const tokens = [
  ['workers/admin-api/src/auditLog.ts', 'recordAdminDryRunAudit'],
  ['workers/admin-api/src/auditLog.ts', 'makeAdminRequestId'],
  ['workers/admin-api/src/auditLog.ts', 'AdminAuditLogWriteError'],
  ['workers/admin-api/src/auditLog.ts', 'admin_action_audit_log'],
  ['workers/admin-api/src/auditLog.ts', 'dry_run_result_json'],
  ['workers/admin-api/src/auditLog.ts', 'actor_email_masked'],
  ['workers/admin-api/src/auditLog.ts', 'request_id'],
  ['workers/admin-api/src/auditLog.ts', 'cf_ray'],
  ['workers/admin-api/src/index.ts', 'recordAdminDryRunAudit'],
  ['workers/admin-api/src/index.ts', 'respondWithAuditedDryRun'],
  ['workers/admin-api/src/index.ts', '/api/audit-log'],
  ['workers/admin-api/src/db.ts', 'listAdminActionAuditLog'],
  ['workers/admin-api/src/db.ts', 'admin_action_audit_log'],
  ['workers/admin-api/src/types.ts', 'AdminActionAuditSummary'],
  ['workers/admin-api/src/types.ts', 'auditLogId'],
  ['workers/admin-api/src/types.ts', 'auditRecordedAt'],
  ['workers/admin-api/src/types.ts', 'requestId'],
  ['admin/src/lib/adminApiClient.ts', 'fetchAdminActionAuditLog'],
  ['admin/src/types/admin.ts', 'AdminActionAuditSummary'],
  ['admin/src/views/AuditLogView.vue', 'executionAllowed=true'],
  ['admin/src/views/AuditLogView.vue', 'admin_action_audit_log'],
  ['admin/src/router.ts', "'/audit-log'"],
  ['admin/src/App.vue', 'Audit Log'],
  ['workers/admin-api/migrations/0005_admin_action_audit_log_runtime_fields.sql', 'plan_status'],
  ['workers/admin-api/migrations/0005_admin_action_audit_log_runtime_fields.sql', 'request_id'],
]
for (const [file, token] of tokens) if (!exists(file) || !read(file).includes(token)) failures.push(`${file} missing token: ${token}`)

const auditText = exists('workers/admin-api/src/auditLog.ts') ? read('workers/admin-api/src/auditLog.ts') : ''
for (const forbidden of ['raw Access JWT', 'paymentKey:', 'buyerEmail:', 'requiredConfirmPhrase: plan.requiredConfirmPhrase', 'confirmPhrase: dryRunInput.confirmPhrase']) {
  if (auditText.includes(forbidden)) failures.push(`auditLog.ts appears to persist forbidden raw field: ${forbidden}`)
}
if (!/INSERT INTO admin_action_audit_log/i.test(auditText)) failures.push('auditLog.ts missing admin_action_audit_log INSERT')
if (!/auditReady\s*=\s*true/.test(auditText)) failures.push('auditLog.ts does not set plan.auditReady = true')
if (!/auditLogId\s*=\s*id/.test(auditText)) failures.push('auditLog.ts does not attach auditLogId')
if (!/ADMIN_AUDIT_LOG_WRITE_FAILED/.test(read('workers/admin-api/src/index.ts'))) failures.push('index.ts missing fail-closed audit write error')

const pkg = JSON.parse(read('package.json'))
if (!pkg.scripts?.['smoke:admin-audit-log']) failures.push('package.json missing smoke:admin-audit-log')
if (!String(pkg.scripts?.['check:security-smoke'] ?? '').includes('smoke:admin-audit-log')) failures.push('check:security-smoke missing smoke:admin-audit-log')
if (!read('scripts/check-launch.mjs').includes('smoke-admin-audit-log.mjs')) failures.push('check-launch missing smoke-admin-audit-log')

if (failures.length) {
  console.error('[smoke:admin-audit-log] FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('[smoke:admin-audit-log] OK admin dry-run audit ledger is recorded and surfaced')

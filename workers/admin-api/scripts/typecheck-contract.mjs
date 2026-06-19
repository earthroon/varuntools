#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.cwd(), '..', '..')
const failures = []
function exists(relativePath) { return fs.existsSync(path.join(root, relativePath)) }
function read(relativePath) { return exists(relativePath) ? fs.readFileSync(path.join(root, relativePath), 'utf8') : '' }
function requireFile(relativePath) { if (!exists(relativePath)) failures.push('missing ' + relativePath) }
function requireToken(relativePath, token) { if (!read(relativePath).includes(token)) failures.push(relativePath + ' missing token: ' + token) }

for (const file of [
  'workers/admin-api/src/access.ts',
  'workers/admin-api/src/auditLog.ts',
  'workers/admin-api/src/db.ts',
  'workers/admin-api/src/index.ts',
  'workers/admin-api/src/types.ts',
  'workers/admin-api/migrations/0004_admin_action_audit_log.sql',
  'workers/admin-api/migrations/0005_admin_action_audit_log_runtime_fields.sql',
]) requireFile(file)

for (const [file, tokens] of Object.entries({
  'workers/admin-api/src/access.ts': ['crypto.subtle.verify', 'Cf-Access-Jwt-Assertion', 'ACCESS_SIGNATURE_INVALID'],
  'workers/admin-api/src/auditLog.ts': ['recordAdminDryRunAudit', 'AdminAuditLogWriteError', 'INSERT INTO admin_action_audit_log'],
  'workers/admin-api/src/db.ts': ['listAdminActionAuditLog', 'admin_action_audit_log'],
  'workers/admin-api/src/index.ts': ['respondWithAuditedDryRun', 'ADMIN_AUDIT_LOG_WRITE_FAILED', '/api/audit-log'],
  'workers/admin-api/src/types.ts': ['AccessIdentity', 'iss: string', 'AdminActionAuditSummary'],
})) {
  for (const token of tokens) requireToken(file, token)
}

if (failures.length > 0) {
  console.error('[admin-api:typecheck] failed')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('[admin-api:typecheck] OK admin worker contract files are present')

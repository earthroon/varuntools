#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const failures = []
const exists = (file) => fs.existsSync(path.join(root, file))
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const walk = (dir) => {
  const abs = path.join(root, dir)
  if (!fs.existsSync(abs)) return []
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
}

const required = [
  'workers/admin-api/src/writeActionGuards.ts',
  'workers/admin-api/src/writeActionPlans.ts',
  'workers/admin-api/migrations/0004_admin_action_audit_log.sql',
  'admin/src/lib/adminWriteActions.ts',
  'admin/src/components/AdminWriteActionCard.vue',
  'admin/src/views/WriteGuardrailsView.vue',
  'docs/admin/admin-write-guardrails.md',
  'docs/admin/admin-action-audit-log.md',
  'docs/ops/grant-revoke-dry-run.md',
  'docs/ops/grant-reissue-dry-run.md',
  'docs/ops/refund-note-dry-run.md',
  'docs/ops/webhook-replay-guardrails.md',
  'docs/migration/commit-80.md',
]
for (const file of required) if (!exists(file)) failures.push(`missing required file: ${file}`)

const tokens = [
  ['workers/admin-api/src/types.ts', 'grant-revoke'],
  ['workers/admin-api/src/types.ts', 'grant-reissue'],
  ['workers/admin-api/src/types.ts', 'refund-note'],
  ['workers/admin-api/src/types.ts', 'webhook-replay'],
  ['workers/admin-api/src/index.ts', 'dry-run'],
  ['workers/admin-api/src/types.ts', 'requiredConfirmPhrase'],
  ['workers/admin-api/src/types.ts', 'AdminWriteActionPlan'],
  ['workers/admin-api/src/env.ts', 'ADMIN_WRITE_MODE'],
  ['workers/admin-api/migrations/0004_admin_action_audit_log.sql', 'admin_action_audit_log'],
  ['workers/admin-api/src/writeActionGuards.ts', 'blockRuntimeWriteAction'],
  ['workers/admin-api/src/writeActionPlans.ts', 'REVOKE GRANT'],
  ['workers/admin-api/src/writeActionPlans.ts', 'REISSUE GRANT'],
  ['workers/admin-api/src/writeActionPlans.ts', 'REFUND NOTE'],
  ['workers/admin-api/src/writeActionPlans.ts', 'REPLAY WEBHOOK'],
]
for (const [file, token] of tokens) if (!exists(file) || !read(file).includes(token)) failures.push(`${file} missing token: ${token}`)

for (const file of walk('workers/admin-api/src').filter((item) => /\.(ts|js)$/.test(item))) {
  const text = read(file)
  for (const pattern of [/prepare\([^)]*UPDATE\s/i, /prepare\([^)]*INSERT\s/i, /prepare\([^)]*DELETE\s/i, /\.exec\([^)]*UPDATE\s/i, /\.exec\([^)]*INSERT\s/i, /\.exec\([^)]*DELETE\s/i]) {
    if (!pattern.test(text)) continue
    const auditInsertAllowed = file === 'workers/admin-api/src/auditLog.ts' && /INSERT INTO admin_action_audit_log/i.test(text) && String(pattern).includes('INSERT')
    if (!auditInsertAllowed) failures.push(`${file} contains forbidden runtime mutation pattern: ${pattern}`)
  }
}

const adminText = walk('admin/src').filter((item) => /\.(ts|vue)$/.test(item)).map((file) => `${file}\n${read(file)}`).join('\n')
for (const token of ['Revoke Now', 'Reissue Now', 'Refund Now', 'Replay Now', 'executeGrantRevoke', 'executeGrantReissue']) {
  if (adminText.includes(token)) failures.push(`admin/src contains forbidden execution token: ${token}`)
}


const planTypeText = read('workers/admin-api/src/types.ts')
for (const token of [
  'AdminWriteActionPlanStatus',
  'planGenerated',
  'planValid',
  'dryRunAllowed',
  'executionAllowed',
  'runtimeBlocked',
  'confirmationRequired',
  'confirmationSatisfied',
  'auditRequired',
  'auditReady',
  'executionBlockedReason',
]) {
  if (!planTypeText.includes(token)) failures.push(`workers/admin-api/src/types.ts missing split plan field: ${token}`)
}

const planText = read('workers/admin-api/src/writeActionPlans.ts')
for (const token of [
  "plan.ok = plan.planValid",
  "plan.allowed = plan.executionAllowed",
  "check.code === 'runtime-write-blocked'",
  "plan.status = 'runtime-blocked'",
  "plan.executionAllowed = false",
  "plan.runtimeBlocked = true",
]) {
  if (!planText.includes(token)) failures.push(`writeActionPlans.ts missing status contract token: ${token}`)
}

const adminPlanText = read('admin/src/types/admin.ts')
for (const token of ['AdminWriteActionPlanStatus', 'planValid', 'executionAllowed', 'runtimeBlocked', 'auditRequired']) {
  if (!adminPlanText.includes(token)) failures.push(`admin/src/types/admin.ts missing split plan field: ${token}`)
}

const guardrailUiText = read('admin/src/views/WriteGuardrailsView.vue') + read('admin/src/components/AdminWriteActionCard.vue')
for (const token of ['executionAllowed', 'valid plan never implies execution permission', 'Dry-run planning']) {
  if (!guardrailUiText.includes(token)) failures.push(`admin write guardrail UI missing state split language: ${token}`)
}

const pkg = JSON.parse(read('package.json'))
if (!pkg.scripts?.['smoke:admin-write-guardrails']) failures.push('package.json missing smoke:admin-write-guardrails')
if (!read('scripts/check-launch.mjs').includes('smoke-admin-write-guardrails.mjs')) failures.push('check-launch missing smoke-admin-write-guardrails')
if (!read('admin/src/router.ts').includes("'/write-guardrails'")) failures.push('admin router missing /write-guardrails')
if (failures.length) {
  console.error('[smoke:admin-write-guardrails] FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('[smoke:admin-write-guardrails] OK dry-run write guardrails are sealed and runtime mutations remain blocked')

#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const requiredFiles = [
  'docs/ops/inquiry-response-workflow.md',
  'docs/ops/inquiry-sheet-columns.csv',
  'docs/templates/inquiry-reply-templates.md',
]
const requiredStatuses = ['new', 'triaged', 'needs-reply', 'replied', 'waiting-user', 'closed', 'spam', 'archived']
const requiredPriorities = ['low', 'normal', 'high', 'urgent']
const requiredReplyNeeds = ['not-needed', 'optional', 'required']
const requiredColumns = ['opsStatus', 'opsPriority', 'replyNeed', 'replyChannel', 'assignedTo', 'repliedAt', 'closedAt', 'internalMemo', 'publicReplySummary', 'nextAction']
const requiredCategories = ['product', 'commission', 'support', 'collaboration', 'general']
function fail(message) { console.error(`[smoke:inquiry-response-workflow] FAIL ${message}`); process.exit(1) }
function readRequired(relativePath) { const absolute = path.join(root, relativePath); if (!fs.existsSync(absolute)) fail(`missing file: ${relativePath}`); return fs.readFileSync(absolute, 'utf8') }
function requireIncludes(haystack, needle, label) { if (!haystack.includes(needle)) fail(`${label} missing: ${needle}`) }
for (const file of requiredFiles) readRequired(file)
const workflow = readRequired('docs/ops/inquiry-response-workflow.md')
const columns = readRequired('docs/ops/inquiry-sheet-columns.csv')
const templates = readRequired('docs/templates/inquiry-reply-templates.md')
const packageJson = JSON.parse(readRequired('package.json'))
const checkLaunch = readRequired('scripts/check-launch.mjs')
for (const status of requiredStatuses) requireIncludes(workflow, status, 'workflow status')
for (const priority of requiredPriorities) requireIncludes(workflow, priority, 'workflow priority')
for (const replyNeed of requiredReplyNeeds) requireIncludes(workflow, replyNeed, 'workflow replyNeed')
for (const column of requiredColumns) requireIncludes(columns, column, 'sheet column')
for (const category of requiredCategories) { requireIncludes(workflow, category, 'workflow category'); requireIncludes(templates, category, 'reply template category') }
for (const phrase of ['gateCode is not a login password', 'gateCode is not an inquiry lookup password', 'gateCode is not an authentication token', 'gateCode must not be used for user verification', 'Cloudflare Worker', 'D1', 'KV', 'Google Sheets API', 'Apps Script automation']) requireIncludes(workflow, phrase, 'workflow boundary')
for (const phrase of ['Product inquiry reply', 'Commission inquiry reply', 'Collaboration proposal reply', 'Support inquiry reply', 'General inquiry reply', 'Additional information request', 'Out-of-scope inquiry reply', '문의 접수 요청이 완료되었습니다.', 'gateCode']) requireIncludes(templates, phrase, 'reply template')
if (packageJson.scripts?.['smoke:inquiry-response-workflow'] !== 'node scripts/smoke-inquiry-response-workflow.mjs') fail('package.json missing smoke:inquiry-response-workflow script')
requireIncludes(checkLaunch, 'scripts/smoke-inquiry-response-workflow.mjs', 'check:launch')
requireIncludes(checkLaunch, 'smoke:inquiry-google-form', 'check:launch order precondition')
requireIncludes(checkLaunch, 'smoke:inquiry-response-workflow', 'check:launch label')
console.log('[smoke:inquiry-response-workflow] OK workflow docs, sheet columns, reply templates, and launch wiring are valid')

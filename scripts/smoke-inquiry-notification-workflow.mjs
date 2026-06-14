#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import process from 'node:process'

const checks = []
function read(path) {
  if (!existsSync(path)) throw new Error(`${path} is missing`)
  return readFileSync(path, 'utf8')
}
function expectFile(path) {
  checks.push([`file exists: ${path}`, () => existsSync(path)])
}
function expectIncludes(path, token) {
  checks.push([`${path} includes ${token}`, () => read(path).includes(token)])
}
function expectNotIncludes(path, token) {
  checks.push([`${path} does not include ${token}`, () => !read(path).includes(token)])
}

expectFile('workers/inquiry-api/src/notification.ts')
expectFile('workers/inquiry-api/src/notificationTypes.ts')
expectFile('workers/inquiry-api/src/notificationConfig.ts')
expectIncludes('workers/inquiry-api/src/notificationTypes.ts', 'InquiryNotificationPayloadV1')
expectIncludes('workers/inquiry-api/src/notificationTypes.ts', 'InquiryNotificationAdapter')
expectIncludes('workers/inquiry-api/src/notificationTypes.ts', 'InquiryNotificationResult')
expectIncludes('workers/inquiry-api/src/notificationTypes.ts', 'InquiryApiNotificationSummary')
expectIncludes('workers/inquiry-api/src/status.ts', 'notification-dispatched')
expectIncludes('workers/inquiry-api/src/status.ts', 'notification-failed')
expectIncludes('workers/inquiry-api/src/status.ts', 'reply-drafted')
expectIncludes('workers/inquiry-api/src/status.ts', 'reply-sent-manually')
expectIncludes('workers/inquiry-api/src/index.ts', 'dispatchInquiryNotification')
expectIncludes('workers/inquiry-api/src/index.ts', 'stored.persisted')
expectIncludes('workers/inquiry-api/src/index.ts', 'notification,')
expectIncludes('workers/inquiry-api/src/notification.ts', 'message:')
expectIncludes('workers/inquiry-api/src/notification.ts', 'hasEmail')
expectIncludes('workers/inquiry-api/src/notification.ts', 'adminUrl')
expectIncludes('workers/inquiry-api/src/notification.ts', 'Mock notification recorded. No external delivery was attempted.')
expectIncludes('workers/inquiry-api/src/notification.ts', 'Automatic email delivery is intentionally not implemented in Commit 119.')
expectIncludes('workers/inquiry-api/src/notification.ts', 'External webhook delivery is not enabled by default in Commit 119.')
expectNotIncludes('workers/inquiry-api/src/notificationTypes.ts', 'message: string\n  email')
expectNotIncludes('workers/inquiry-api/src/notificationTypes.ts', 'payloadJson')

expectFile('admin/src/components/inquiries/InquiryReplyWorkflowPanel.vue')
expectFile('admin/src/components/inquiries/InquiryReplyTemplatePicker.vue')
expectFile('admin/src/components/inquiries/InquiryManualReplyChecklist.vue')
expectFile('admin/src/lib/inquiryReplyTemplates.ts')
expectFile('admin/src/types/inquiryReply.ts')
expectIncludes('admin/src/lib/inquiryReplyTemplates.ts', 'INQUIRY_REPLY_TEMPLATES')
expectIncludes('admin/src/lib/inquiryReplyTemplates.ts', 'INQUIRY_MANUAL_REPLY_CHECKLIST')
expectIncludes('admin/src/lib/inquiryReplyTemplates.ts', 'INQUIRY_REPLY_STATUS_GUIDE')
expectIncludes('admin/src/components/inquiries/InquiryReplyWorkflowPanel.vue', 'Automatic sending is intentionally disabled')
expectIncludes('admin/src/components/inquiries/InquiryReplyWorkflowPanel.vue', 'Copy reply draft')
expectIncludes('admin/src/components/inquiries/InquiryDetailPanel.vue', 'InquiryReplyWorkflowPanel')
expectIncludes('admin/src/types/inquiryAdmin.ts', 'notification-dispatched')
expectIncludes('workers/admin-api/src/inquiryTypes.ts', 'notification-dispatched')

expectFile('docs/authoring/inquiry-notification-workflow.md')
expectFile('docs/authoring/inquiry-reply-workflow.md')
expectFile('docs/migration/commit-119.md')
expectFile('BAKE_REPORT_COMMIT_119.md')
expectIncludes('package.json', 'smoke:inquiry-notification-workflow')
expectIncludes('scripts/check-launch.mjs', 'smoke-inquiry-notification-workflow.mjs')

const allSource = [
  'workers/inquiry-api/src/notification.ts',
  'workers/inquiry-api/src/notificationTypes.ts',
  'workers/inquiry-api/src/notificationConfig.ts',
  'admin/src/components/inquiries/InquiryReplyWorkflowPanel.vue',
  'admin/src/lib/inquiryReplyTemplates.ts',
  'BAKE_REPORT_COMMIT_119.md',
].map(read).join('\n')
if (allSource.includes('[object Object]')) throw new Error('source contains [object Object]')

const failures = []
for (const [label, fn] of checks) {
  try {
    if (!fn()) failures.push(label)
  } catch (error) {
    failures.push(`${label}: ${error.message}`)
  }
}

if (failures.length) {
  console.error('[smoke:inquiry-notification-workflow] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:inquiry-notification-workflow] passed ${checks.length} checks`)

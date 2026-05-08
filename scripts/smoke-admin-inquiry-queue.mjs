import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const checks = []
function check(label, condition) { checks.push({ label, condition: Boolean(condition) }) }
function contains(file, token) { return exists(file) && read(file).includes(token) }

check('admin inquiry API file exists', exists('workers/admin-api/src/inquiries.ts'))
check('admin inquiry status transition guard exists', exists('workers/admin-api/src/inquiryStatusTransition.ts'))
check('admin inquiry API types exist', exists('workers/admin-api/src/inquiryTypes.ts'))
check('INQUIRY_DB binding added to Admin API env', contains('workers/admin-api/src/types.ts', 'INQUIRY_DB?: D1Database'))
check('INQUIRY_DB binding added to wrangler.toml', contains('workers/admin-api/wrangler.toml', 'binding = "INQUIRY_DB"'))
check('GET /api/inquiries list route exists', contains('workers/admin-api/src/index.ts', "url.pathname==='/api/inquiries'"))
check('GET /api/inquiries/:id detail route exists', contains('workers/admin-api/src/index.ts', 'readAdminInquiryDetail'))
check('PATCH /api/inquiries/:id/status route exists', contains('workers/admin-api/src/index.ts', 'updateAdminInquiryStatus'))
check('PATCH /api/inquiries/:id/priority route exists', contains('workers/admin-api/src/index.ts', 'updateAdminInquiryPriority'))
check('POST /api/inquiries/:id/events route exists', contains('workers/admin-api/src/index.ts', 'addAdminInquiryNote'))
check('INVALID_STATUS_TRANSITION exists', contains('workers/admin-api/src/inquiries.ts', 'INVALID_STATUS_TRANSITION'))
check('status-changed event is written', contains('workers/admin-api/src/inquiries.ts', "eventType:'status-changed'"))
check('priority-changed event is written', contains('workers/admin-api/src/inquiries.ts', "eventType:'priority-changed'"))
check('note-added event is written', contains('workers/admin-api/src/inquiries.ts', "eventType:'note-added'"))
check('admin inquiry route exists', contains('admin/src/router.ts', "path: '/inquiries'"))
check('admin inquiry view exists', exists('admin/src/views/InquiriesView.vue'))
check('InquiryQueueTable exists', exists('admin/src/components/inquiries/InquiryQueueTable.vue'))
check('InquiryFilterBar exists', exists('admin/src/components/inquiries/InquiryFilterBar.vue'))
check('InquiryDetailPanel exists', exists('admin/src/components/inquiries/InquiryDetailPanel.vue'))
check('InquiryEventTimeline exists', exists('admin/src/components/inquiries/InquiryEventTimeline.vue'))
check('notification adapter is not added', !contains('workers/admin-api/src/index.ts', 'Slack') && !contains('workers/admin-api/src/index.ts', 'Discord'))
check('public customer lookup is not added', !contains('src/router/index.ts', '/inquiries/:id') && !contains('src/router.ts', '/inquiries/:id'))
check('Google Form fallback remains available', contains('src/utils/inquiryGoogleFormSubmit.ts', 'google-form') && contains('src/utils/inquiryGoogleFormSubmit.ts', "mode: 'no-cors'"))
check('Worker-first migration state is explicit', contains('src/config/inquiryWorkerApi.ts', 'enabled: true') && contains('src/config/inquiryWorkerApi.ts', "primaryTarget: 'worker'"))

const objectLeakFiles = [
  'workers/admin-api/src/inquiries.ts',
  'workers/admin-api/src/inquiryTypes.ts',
  'workers/admin-api/src/inquiryStatusTransition.ts',
  'workers/admin-api/src/index.ts',
  'admin/src/views/InquiriesView.vue',
  'admin/src/lib/adminInquiryApi.ts',
  'admin/src/types/inquiryAdmin.ts',
  'admin/src/components/inquiries/InquiryQueueTable.vue',
  'admin/src/components/inquiries/InquiryFilterBar.vue',
  'admin/src/components/inquiries/InquiryDetailPanel.vue',
  'admin/src/components/inquiries/InquiryEventTimeline.vue',
]
const objectObjectFound = objectLeakFiles.some((file) => read(file).includes('[object Object]'))
check('source contains no [object Object]', !objectObjectFound)

const failed = checks.filter((item) => !item.condition)
for (const item of checks) console.log(`${item.condition ? 'ok' : 'fail'} - ${item.label}`)
if (failed.length) {
  console.error(`\nsmoke:admin-inquiry-queue failed: ${failed.length} check(s) failed.`)
  process.exit(1)
}
console.log('\nsmoke:admin-inquiry-queue passed')

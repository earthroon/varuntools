#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { if (!condition) failures.push(name) }

const files = {
  migration: 'workers/inquiry-api/migrations/0001_inquiry_storage.sql',
  index: 'workers/inquiry-api/src/index.ts',
  types: 'workers/inquiry-api/src/types.ts',
  status: 'workers/inquiry-api/src/status.ts',
  storage: 'workers/inquiry-api/src/storage.ts',
  id: 'workers/inquiry-api/src/id.ts',
  runtime: 'workers/inquiry-api/src/worker-runtime.d.ts',
  wrangler: 'workers/inquiry-api/wrangler.toml',
  sourceTypes: 'src/types/inquiry.ts',
  docs: 'docs/authoring/inquiry-d1-storage.md',
  migrationDoc: 'docs/migration/commit-117.md',
  report: 'BAKE_REPORT_COMMIT_117.md',
}

for (const file of Object.values(files)) check(`${file} exists`, exists(file))

const migration = read(files.migration)
const index = read(files.index)
const types = read(files.types)
const status = read(files.status)
const storage = read(files.storage)
const id = read(files.id)
const runtime = read(files.runtime)
const wrangler = read(files.wrangler)
const sourceTypes = read(files.sourceTypes)
const docs = read(files.docs)
const migrationDoc = read(files.migrationDoc)
const report = read(files.report)
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')
const submit = read('src/utils/inquirySubmit.ts')
const googleSubmit = read('src/utils/inquiryGoogleFormSubmit.ts')
const workerSubmit = read('src/utils/inquiryWorkerSubmit.ts')
const googleConfig = read('src/config/inquiryForm.ts')

check('migration creates inquiries table', migration.includes('CREATE TABLE IF NOT EXISTS inquiries'))
check('migration creates inquiry_events table', migration.includes('CREATE TABLE IF NOT EXISTS inquiry_events'))
check('migration has status CHECK constraint', migration.includes('CHECK (status IN') && migration.includes("'waiting-reply'"))
check('migration has priority CHECK constraint', migration.includes('CHECK (priority IN') && migration.includes("'urgent'"))
check('migration has event type CHECK constraint', migration.includes('CHECK (event_type IN') && migration.includes("'status-changed'"))
check('migration has indexes', [
  'idx_inquiries_status',
  'idx_inquiries_priority',
  'idx_inquiries_category',
  'idx_inquiries_created_at',
  'idx_inquiry_events_inquiry_id',
].every((token) => migration.includes(token)))
check('wrangler includes INQUIRY_DB D1 binding', wrangler.includes('[[d1_databases]]') && wrangler.includes('binding = "INQUIRY_DB"'))
check('wrangler includes storage mode', wrangler.includes('INQUIRY_STORAGE_MODE') && wrangler.includes('d1'))
check('runtime Env contains INQUIRY_DB binding', runtime.includes('INQUIRY_DB?: D1Database'))
check('runtime defines minimal D1 types', runtime.includes('type D1Database') && runtime.includes('D1PreparedStatement'))
check('InquiryStatus model exists', status.includes('INQUIRY_STATUSES') && status.includes("'new'") && status.includes("'spam'"))
check('InquiryPriority model exists', status.includes('INQUIRY_PRIORITIES') && status.includes("'normal'") && status.includes("'urgent'"))
check('InquiryEventType model exists', status.includes('INQUIRY_EVENT_TYPES') && status.includes("'received'") && status.includes("'stored'"))
check('storage adapter file contains contracts', storage.includes('type InquiryStorage') && storage.includes('InsertInquiryInput') && storage.includes('StoredInquiryResult'))
check('D1 storage adapter exists', storage.includes('class D1InquiryStorage') && storage.includes('INSERT INTO inquiries') && storage.includes('INSERT INTO inquiry_events'))
check('mock storage adapter exists', storage.includes('class MockInquiryStorage') && storage.includes("storageMode: 'mock'"))
check('storage inserts received and stored events', storage.includes("eventType: 'received'") && storage.includes("eventType: 'stored'"))
check('storage preserves payload_json', storage.includes('payload_json') && storage.includes('payloadJson'))
check('storage stores ip_hash not raw ip field', migration.includes('ip_hash TEXT') && !migration.includes(' ip TEXT'))
check('id helpers exist', id.includes('createInquiryId') && id.includes('createInquiryEventId') && id.includes('sha256Hex'))
check('POST handler calls storage after validation', index.includes('createInquiryStorage') && index.includes('storage.insertInquiry') && index.includes('receivedAt: new Date().toISOString()'))
check('POST handler hashes IP before storage', index.includes('requestIpHash') && index.includes('sha256Hex'))
check('D1 success can return persisted true', types.includes('persisted: boolean') && storage.includes('persisted: true') && index.includes('persisted: stored.persisted'))
check('response includes storageMode', types.includes('storageMode: InquiryStorageMode') && index.includes('storageMode: stored.storageMode'))
check('storage failure maps to SERVER_ERROR', index.includes('Inquiry storage failed.') && index.includes("'SERVER_ERROR'"))
check('source types know storage response', sourceTypes.includes("export type InquiryStorageMode = 'd1' | 'mock'") && sourceTypes.includes('persisted: boolean') && sourceTypes.includes('storageMode: InquiryStorageMode'))
check('frontend Worker adapter remains available', workerSubmit.includes('submitInquiryToWorkerApi') && workerSubmit.includes("mode: 'worker'"))
check('Google Form adapter remains available', googleSubmit.includes('buildInquiryGoogleFormData') && googleSubmit.includes("mode: 'google-form'") && googleConfig.includes('inquiryFormConfig'))
check('Worker-first migration state is explicit', read('src/config/inquiryWorkerApi.ts').includes('enabled: true') && read('src/config/inquiryWorkerApi.ts').includes("primaryTarget: 'worker'"))
check('admin inquiry UI is not added before commit 118 or is intentionally added by commit 118', exists('BAKE_REPORT_COMMIT_118.md') || (!exists('admin/src/views/InquiriesView.vue') && !read('admin/src/router.ts').includes('/inquiries')))
check('docs explain D1 storage', docs.includes('Inquiry D1 Storage Contract') && docs.includes('persisted: true') && docs.includes('Privacy and logging rules'))
check('migration doc explains commit 117', migrationDoc.includes('Commit 117') && migrationDoc.includes('D1-backed inquiry storage'))
check('bake report exists with commit 117 seal', report.includes('Commit 117') && report.includes('D1 저장소와 상태 모델 커밋'))
check('package has smoke script', pkg.scripts?.['smoke:inquiry-d1-storage'] === 'node scripts/smoke-inquiry-d1-storage.mjs')
check('check launch includes inquiry d1 smoke', checkLaunch.includes('smoke:inquiry-d1-storage'))

const projectText = Object.values(files)
  .filter((file) => file.endsWith('.ts') || file.endsWith('.md') || file.endsWith('.sql'))
  .map(read)
  .join('\n')
check('source contains no [object Object]', !projectText.includes('[object Object]'))

if (failures.length) {
  console.error('smoke:inquiry-d1-storage FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('smoke:inquiry-d1-storage OK')

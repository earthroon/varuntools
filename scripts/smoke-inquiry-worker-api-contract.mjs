#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { if (!condition) failures.push(name) }

const files = {
  workerPackage: 'workers/inquiry-api/package.json',
  workerConfig: 'workers/inquiry-api/wrangler.toml',
  workerIndex: 'workers/inquiry-api/src/index.ts',
  workerHttp: 'workers/inquiry-api/src/http.ts',
  workerTypes: 'workers/inquiry-api/src/types.ts',
  workerValidation: 'workers/inquiry-api/src/validation.ts',
  workerRateLimit: 'workers/inquiry-api/src/rateLimit.ts',
  workerRuntime: 'workers/inquiry-api/src/worker-runtime.d.ts',
  sourceTypes: 'src/types/inquiry.ts',
  workerSubmit: 'src/utils/inquiryWorkerSubmit.ts',
  googleSubmit: 'src/utils/inquiryGoogleFormSubmit.ts',
  submit: 'src/utils/inquirySubmit.ts',
  workerConfigSource: 'src/config/inquiryWorkerApi.ts',
  googleConfig: 'src/config/inquiryForm.ts',
  docs: 'docs/authoring/inquiry-worker-api.md',
  migration: 'docs/migration/commit-116.md',
  report: 'BAKE_REPORT_COMMIT_116.md',
}

for (const file of Object.values(files)) check(`${file} exists`, exists(file))

const workerIndex = read(files.workerIndex)
const workerHttp = read(files.workerHttp)
const workerTypes = read(files.workerTypes)
const workerValidation = read(files.workerValidation)
const workerRateLimit = read(files.workerRateLimit)
const sourceTypes = read(files.sourceTypes)
const workerSubmit = read(files.workerSubmit)
const submit = read(files.submit)
const googleSubmit = read(files.googleSubmit)
const workerConfigSource = read(files.workerConfigSource)
const googleConfig = read(files.googleConfig)
const docs = read(files.docs)
const migration = read(files.migration)
const report = read(files.report)
const checkLaunch = read('scripts/check-launch.mjs')
const pkg = JSON.parse(read('package.json'))

check('worker package uses varuntools-inquiry-api name', read(files.workerPackage).includes('varuntools-inquiry-api'))
check('worker wrangler route entry exists', read(files.workerConfig).includes('varuntools-inquiry-api') && read(files.workerConfig).includes('INQUIRY_ALLOWED_ORIGINS'))
check('worker handles POST /api/inquiries', workerIndex.includes("pathname !== '/api/inquiries'") && workerIndex.includes("request.method !== 'POST'"))
check('worker handles OPTIONS preflight', workerIndex.includes("request.method === 'OPTIONS'") && workerHttp.includes('204'))
check('CORS policy exists', workerHttp.includes('Access-Control-Allow-Origin') && workerHttp.includes('POST, OPTIONS') && workerHttp.includes('Content-Type') && workerHttp.includes('Vary'))
check('InquiryApiRequestV1 exists in worker types', workerTypes.includes('InquiryApiRequestV1'))
check('InquiryApiResponse exists in worker types', workerTypes.includes('InquiryApiResponse'))
check('success response declares persisted contract', workerTypes.includes('persisted: boolean') && workerIndex.includes('persisted: stored.persisted'))
check('error codes exist', ['VALIDATION_FAILED', 'HONEYPOT_TRIGGERED', 'SUBMIT_TOO_FAST', 'RATE_LIMITED', 'SERVER_ERROR'].every((token) => workerTypes.includes(token)))
check('server-side validation exists', workerValidation.includes('validateInquiryApiRequest') && workerValidation.includes('version !== 1') && workerValidation.includes('CATEGORY_VALUES'))
check('honeypot rejection exists', workerValidation.includes('HONEYPOT_TRIGGERED') && workerValidation.includes('draft.honeypot'))
check('submit-too-fast rejection exists', workerRateLimit.includes('isSubmitTooFast') && workerValidation.includes('SUBMIT_TOO_FAST'))
check('rate-limit-friendly contract exists', workerRateLimit.includes('isRateLimitedHint') && workerValidation.includes('RATE_LIMITED'))
check('frontend Worker config exists and points to API', workerConfigSource.includes('enabled: true') && workerConfigSource.includes("endpoint: '/api/inquiries'") && workerConfigSource.includes("primaryTarget: 'worker'"))
check('frontend Worker submit adapter exists', workerSubmit.includes('submitInquiryToWorkerApi') && workerSubmit.includes('buildInquiryApiRequestV1') && workerSubmit.includes("mode: 'worker'"))
check('frontend submit targets Worker through strategy', submit.includes('inquirySubmitStrategy') && submit.includes('submitInquiryToWorkerApi'))
check('Google Form adapter remains available', googleSubmit.includes('buildInquiryGoogleFormData') && googleSubmit.includes("mode: 'no-cors'") && googleConfig.includes('inquiryFormConfig'))
check('source types include Worker API contract', sourceTypes.includes('InquiryApiRequestV1') && sourceTypes.includes('InquiryApiResponse') && sourceTypes.includes("'worker'"))
check('docs include POST contract', docs.includes('POST /api/inquiries') && docs.includes('InquiryApiRequestV1') && docs.includes('InquiryApiResponse'))
check('docs state D1 excluded in commit 116', docs.includes('D1 저장') && docs.includes('Commit 117'))
check('docs state Google Form fallback preserved', docs.includes('Google Form') && docs.includes('fallback'))
check('migration doc states Worker-first later', migration.includes('Worker-first') && migration.includes('Commit 120'))
check('bake report exists with commit 116 seal', report.includes('Commit 116') && report.includes('저장소 커밋이 아니라 Worker API 계약 커밋'))
check('package has smoke script', pkg.scripts?.['smoke:inquiry-worker-api-contract'] === 'node scripts/smoke-inquiry-worker-api-contract.mjs')
check('package has inquiry-api scripts', pkg.scripts?.['inquiry-api:typecheck'] === 'npm --prefix workers/inquiry-api run typecheck')
check('check launch includes inquiry worker api smoke', checkLaunch.includes('smoke:inquiry-worker-api-contract'))

const projectText = Object.values(files).filter((file) => file.endsWith('.ts') || file.endsWith('.md')).map(read).join('\n')
check('source contains no [object Object]', !projectText.includes('[object Object]'))

if (failures.length) {
  console.error('smoke:inquiry-worker-api-contract FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('smoke:inquiry-worker-api-contract OK')

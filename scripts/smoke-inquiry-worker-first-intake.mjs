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

expectFile('src/config/inquiryWorkerApi.ts')
expectFile('src/utils/inquirySubmit.ts')
expectFile('src/utils/inquiryWorkerSubmit.ts')
expectFile('src/utils/inquiryGoogleFormSubmit.ts')
expectFile('src/components/InquiryForm.vue')
expectFile('src/types/inquiry.ts')
expectFile('docs/authoring/inquiry-worker-first-intake.md')
expectFile('docs/migration/commit-120.md')
expectFile('BAKE_REPORT_COMMIT_120.md')

expectIncludes('src/config/inquiryWorkerApi.ts', 'enabled: true')
expectIncludes('src/config/inquiryWorkerApi.ts', "endpoint: '/api/inquiries'")
expectIncludes('src/config/inquiryWorkerApi.ts', "primaryTarget: 'worker'")
expectIncludes('src/config/inquiryWorkerApi.ts', "fallbackPolicy: 'google-form-on-worker-error'")
expectIncludes('src/config/inquiryWorkerApi.ts', 'allowGoogleFormFallback: true')

expectIncludes('src/types/inquiry.ts', 'InquirySubmitTarget')
expectIncludes('src/types/inquiry.ts', 'InquirySubmitFallbackPolicy')
expectIncludes('src/types/inquiry.ts', 'InquirySubmitStrategy')
expectIncludes('src/types/inquiry.ts', 'InquiryApiNotificationSummary')
expectIncludes('src/types/inquiry.ts', "export type InquirySubmitStorageMode = InquiryStorageMode | 'google-form'")
expectIncludes('src/types/inquiry.ts', 'fallbackUsed: boolean')
expectIncludes('src/types/inquiry.ts', 'storageMode: InquirySubmitStorageMode')

expectIncludes('src/utils/inquirySubmit.ts', 'inquirySubmitStrategy')
expectIncludes('src/utils/inquirySubmit.ts', 'submitInquiryToWorkerApi')
expectIncludes('src/utils/inquirySubmit.ts', 'submitInquiryToGoogleForm')
expectIncludes('src/utils/inquirySubmit.ts', 'canFallbackToGoogleForm')
expectIncludes('src/utils/inquirySubmit.ts', "result.errorCode === 'WORKER_UNAVAILABLE' || result.errorCode === 'SERVER_ERROR'")
expectIncludes('src/utils/inquirySubmit.ts', "errorCode: 'VALIDATION_FAILED'")
expectIncludes('src/utils/inquirySubmit.ts', "errorCode: 'HONEYPOT_TRIGGERED'")
expectIncludes('src/utils/inquirySubmit.ts', "fallbackUsed: false")
expectIncludes('src/utils/inquirySubmit.ts', 'buildWorkerConfig')

expectIncludes('src/utils/inquiryWorkerSubmit.ts', "target: 'worker'")
expectIncludes('src/utils/inquiryWorkerSubmit.ts', "fallbackUsed: false")
expectIncludes('src/utils/inquiryWorkerSubmit.ts', "errorCode: 'WORKER_UNAVAILABLE'")
expectIncludes('src/utils/inquiryWorkerSubmit.ts', "storageMode: data.storageMode")
expectIncludes('src/utils/inquiryWorkerSubmit.ts', 'notification: data.notification')
expectIncludes('src/utils/inquiryWorkerSubmit.ts', '문의가 접수되었습니다')

expectIncludes('src/utils/inquiryGoogleFormSubmit.ts', "mode: 'no-cors'")
expectIncludes('src/utils/inquiryGoogleFormSubmit.ts', "target: 'google-form'")
expectIncludes('src/utils/inquiryGoogleFormSubmit.ts', "storageMode: 'google-form'")
expectIncludes('src/utils/inquiryGoogleFormSubmit.ts', "persisted: false")
expectIncludes('src/utils/inquiryGoogleFormSubmit.ts', '문의가 예비 접수 경로로 전송되었습니다')

expectIncludes('src/components/InquiryForm.vue', 'Worker-first 접수 가능')
expectIncludes('src/components/InquiryForm.vue', '예비 접수 경로')
expectIncludes('src/components/InquiryForm.vue', "submitState.value = result.target === 'mock' ? 'mock' : result.fallbackUsed ? 'fallback-success' : 'success'")
expectIncludes('src/components/InquiryForm.vue', ':data-fallback-used="fallbackUsed"')
expectIncludes('src/components/InquiryForm.vue', '현재 문의글 조회 기능은 제공하지 않습니다')

expectIncludes('src/config/inquiryForm.ts', 'inquiryFormConfig')
expectIncludes('scripts/check-launch.mjs', 'smoke-inquiry-worker-first-intake.mjs')
expectIncludes('package.json', 'smoke:inquiry-worker-first-intake')
expectIncludes('docs/authoring/inquiry-worker-first-intake.md', 'Worker-first')
expectIncludes('docs/authoring/inquiry-worker-first-intake.md', '검증 실패는 fallback 대상이 아니다')
expectIncludes('docs/migration/commit-120.md', 'Google Form 삭제 커밋이 아니다')
expectIncludes('BAKE_REPORT_COMMIT_120.md', 'Commit 120')
expectIncludes('BAKE_REPORT_COMMIT_120.md', 'Worker-first 전환 커밋')

expectNotIncludes('src/utils/inquirySubmit.ts', 'Google Form adapter 삭제')
expectNotIncludes('src/components/InquiryForm.vue', '공개 문의 조회')

const allSource = [
  'src/config/inquiryWorkerApi.ts',
  'src/utils/inquirySubmit.ts',
  'src/utils/inquiryWorkerSubmit.ts',
  'src/utils/inquiryGoogleFormSubmit.ts',
  'src/components/InquiryForm.vue',
  'src/types/inquiry.ts',
  'docs/authoring/inquiry-worker-first-intake.md',
  'docs/migration/commit-120.md',
  'BAKE_REPORT_COMMIT_120.md',
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
  console.error('[smoke:inquiry-worker-first-intake] failed')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`[smoke:inquiry-worker-first-intake] passed ${checks.length} checks`)

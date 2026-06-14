#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { if (!condition) failures.push(name) }

const files = {
  types: 'src/types/inquiry.ts',
  validation: 'src/utils/inquiryValidation.ts',
  submit: 'src/utils/inquirySubmit.ts',
  googleSubmit: 'src/utils/inquiryGoogleFormSubmit.ts',
  prefill: 'src/utils/inquiryPrefill.ts',
  guard: 'src/utils/inquirySubmitGuard.ts',
  component: 'src/components/InquiryForm.vue',
  page: 'src/content/pages/inquiry/index.md',
  docs: 'docs/authoring/inquiry.md',
  googleDocs: 'docs/authoring/inquiry-google-form.md',
  migration: 'docs/migration/commit-115.md',
  report: 'BAKE_REPORT_COMMIT_115.md',
}

for (const file of Object.values(files)) check(`${file} exists`, exists(file))

const types = read(files.types)
const validation = read(files.validation)
const submit = read(files.submit)
const googleSubmit = read(files.googleSubmit)
const prefill = read(files.prefill)
const guard = read(files.guard)
const component = read(files.component)
const docs = read(files.docs)
const googleDocs = read(files.googleDocs)
const launch = read('scripts/check-launch.mjs')
const pkg = JSON.parse(read('package.json'))

check('InquiryValidationOptions type exists', types.includes('InquiryValidationOptions'))
check('validateInquiryDraft accepts options', validation.includes('options: InquiryValidationOptions') && validation.includes('requireNickname') && validation.includes('requireGateCode') && validation.includes('requireEmail'))
check('InquiryForm passes directive props to validation options', component.includes('validationOptions') && component.includes('props.requireNickname') && component.includes('props.requireGateCode') && component.includes('props.requireEmail'))
check('UI uses 제출 확인 코드', component.includes('제출 확인 코드'))
check('UI no longer uses 제출 확인 비밀번호', !component.includes('제출 확인 비밀번호'))
check('gateCode is documented as not login/lookup password', docs.includes('로그인/조회용 비밀번호가 아니다') || docs.includes('not a login password'))
check('query prefill helper exists', prefill.includes('createInquiryPrefillContext') && prefill.includes('applyInquiryPrefillToDraft'))
check('category/ref query contract exists', prefill.includes("params.get('category')") && prefill.includes("params.get('type')") && prefill.includes("params.get('ref')"))
check('query values are documented as validation targets', docs.includes('query') && docs.includes('validation'))
check('minimum submit delay exists', guard.includes('DEFAULT_INQUIRY_MINIMUM_SUBMIT_DELAY_MS') && guard.includes('1500'))
check('duplicate submit guard exists', guard.includes('INQUIRY_DUPLICATE_SUBMIT') && guard.includes('lastSubmitFingerprint'))
check('honeypot guard remains', guard.includes('INQUIRY_HONEYPOT_TRIGGERED') && submit.includes('normalizedDraft.honeypot'))
check('InquiryUiState exists', types.includes('InquiryUiState') && component.includes('submitState'))
check('InquiryPayloadV1 exists', types.includes('InquiryPayloadV1') && submit.includes('createInquiryPayloadV1'))
check('Google Form no-cors wording is request based', googleSubmit.includes('문의 접수 요청이 완료되었습니다') && googleSubmit.includes('응답 본문을 확인할 수 없으므로'))
check('package has smoke script', pkg.scripts?.['smoke:inquiry-intake-contract'] === 'node scripts/smoke-inquiry-intake-contract.mjs')
check('check launch includes intake smoke', launch.includes('smoke:inquiry-intake-contract'))
check('docs mention Worker/D1 extension boundary', docs.includes('Worker') && docs.includes('D1'))
check('google docs mention confirmation code', googleDocs.includes('제출 확인 코드'))

const projectText = [types, validation, submit, prefill, guard, component].join('\n')
check('source contains no [object Object]', !projectText.includes('[object Object]'))

if (failures.length) {
  console.error('smoke:inquiry-intake-contract FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('smoke:inquiry-intake-contract OK')

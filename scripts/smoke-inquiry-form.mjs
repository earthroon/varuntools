#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { if (!condition) failures.push(name) }

const requiredFiles = [
  'src/content/pages/inquiry/index.md',
  'src/components/InquiryForm.vue',
  'src/types/inquiry.ts',
  'src/utils/inquiryValidation.ts',
  'src/utils/inquirySubmit.ts',
  'src/utils/inquiryGoogleFormSubmit.ts',
  'src/utils/inquiryPrefill.ts',
  'src/utils/inquirySubmitGuard.ts',
  'src/config/inquiryForm.ts',
  'src/markdown/directives/inquiryFormDirective.ts',
  'docs/authoring/inquiry.md',
  'docs/migration/commit-57.md',
]

for (const file of requiredFiles) check(`${file} exists`, exists(file))

const page = read('src/content/pages/inquiry/index.md')
check('inquiry page has public slug', page.includes('slug: "inquiry"'))
check('inquiry page uses ::inquiry-form', page.includes('::inquiry-form'))
check('inquiry page requires gate code', page.includes('requireGateCode: true'))

const component = read('src/components/InquiryForm.vue')
for (const token of [
  'gateCode',
  'submitInquiry',
  'validateInquiryDraft',
  'validationOptions',
  'createInquirySubmitGuard',
  'getBrowserInquiryPrefillContext',
  'role="alert"',
  'role="status"',
  'aria-live="polite"',
  'aria-pressed',
  "'password'",
  '제출 확인 코드',
  '로그인/조회용 비밀번호가 아니라',
]) check(`InquiryForm contains ${token}`, component.includes(token))

check('InquiryForm no longer labels gate code as password', !component.includes('제출 확인 비밀번호'))

const types = read('src/types/inquiry.ts')
for (const token of ['InquiryCategory', 'InquiryDraft', 'gateCode', 'InquiryValidationOptions', 'InquiryUiState', 'InquiryPayloadV1', 'InquirySubmitMode', 'google-form', 'mock']) {
  check(`inquiry types contain ${token}`, types.includes(token))
}
check('InquiryDraft does not define password field', !/password\s*:/.test(types))

const validation = read('src/utils/inquiryValidation.ts')
for (const token of ['INQUIRY_CATEGORIES', 'validateInquiryDraft', 'InquiryValidationOptions', 'normalizeInquiryDraft', 'requireNickname', 'requireGateCode', 'requireEmail', 'nickname.length < 2', 'gateCode.length < 4', 'EMAIL_RE', 'consent']) {
  check(`inquiry validation contains ${token}`, validation.includes(token))
}

const submit = read('src/utils/inquirySubmit.ts')
const googleSubmit = read('src/utils/inquiryGoogleFormSubmit.ts')
for (const token of ['submitInquiry', 'createInquiryPayloadV1', 'buildInquiryGoogleFormData', 'submitInquiryToWorkerApi', 'inquirySubmitStrategy', 'InquiryPayloadV1']) {
  check(`inquiry submit contains ${token}`, submit.includes(token))
}
for (const token of ['buildInquiryGoogleFormData', 'FormData', "mode: 'no-cors'", 'isInquiryGoogleFormReady', "mode: 'mock'"]) {
  check(`google form submit contains ${token}`, googleSubmit.includes(token))
}

const config = read('src/config/inquiryForm.ts')
check('Google Form config starts disabled', config.includes('enabled: false'))
check('Google Form config keeps actionUrl empty', config.includes("actionUrl: ''"))
check('Google Form config maps gateCode', config.includes('gateCode'))

check('directiveTypes registers inquiry-form', read('src/markdown/directiveTypes.ts').includes("'inquiry-form'"))
check('directive index renders inquiry-form', read('src/markdown/directives/index.ts').includes('renderInquiryFormDirective'))
check('mountMarkdownComponents mounts inquiry-form', read('src/markdown/mountMarkdownComponents.ts').includes("querySelectorAll('inquiry-form, [data-vt-component=\"inquiry-form\"]')"))
check('styles contain inquiry form', read('src/styles/markdown-components.css').includes('.vt-inquiry-form'))

const allProjectText = [
  component,
  types,
  validation,
  submit,
  googleSubmit,
  config,
  read('src/markdown/directives/inquiryFormDirective.ts'),
].join('\n')

for (const forbidden of [
  'passwordHash',
  'localStorage.setItem',
  'sessionStorage.setItem',
  'appendInquiry',
]) check(`forbidden token absent: ${forbidden}`, !allProjectText.includes(forbidden))

check('package has smoke:inquiry-form', JSON.parse(read('package.json')).scripts?.['smoke:inquiry-form'] === 'node scripts/smoke-inquiry-form.mjs')
check('check:launch includes smoke:inquiry-form', read('scripts/check-launch.mjs').includes('smoke:inquiry-form'))
check('launch checklist mentions inquiry form', read('docs/authoring/launch-checklist.md').includes('smoke:inquiry-form'))

if (failures.length) {
  console.error('smoke:inquiry-form FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('smoke:inquiry-form OK')

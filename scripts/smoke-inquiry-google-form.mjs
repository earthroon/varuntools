#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { if (!condition) failures.push(name) }

const files = {
  config: 'src/config/inquiryForm.ts',
  submit: 'src/utils/inquirySubmit.ts',
  googleSubmit: 'src/utils/inquiryGoogleFormSubmit.ts',
  validation: 'src/utils/inquiryValidation.ts',
  types: 'src/types/inquiry.ts',
  component: 'src/components/InquiryForm.vue',
  searchIndex: 'public/search-index.json',
  docs: 'docs/authoring/inquiry-google-form.md',
}

for (const file of Object.values(files)) check(`${file} exists`, exists(file))

const config = read(files.config)
const submit = read(files.submit)
const googleSubmit = read(files.googleSubmit)
const validation = read(files.validation)
const types = read(files.types)
const component = read(files.component)
const docs = read(files.docs)
const projectText = [config, submit, googleSubmit, validation, types, component].join('\n')

for (const token of [
  'validateInquiryGoogleFormConfig',
  'isGoogleFormResponseUrl',
  'isGoogleFormViewUrl',
  'isGoogleFormEntryField',
  'REQUIRED_INQUIRY_GOOGLE_FORM_FIELDS',
  'OPTIONAL_INQUIRY_GOOGLE_FORM_FIELDS',
  'formResponse',
  'viewform',
  'honeypot',
  'entry\\.\\d+',
]) check(`config contains ${token}`, config.includes(token))

check('config starts disabled', config.includes('enabled: false'))
check('config actionUrl empty by default', config.includes("actionUrl: ''"))
check('config has honeypot mapping', /honeypot:\s*''/.test(config))
check('required fields include nickname', config.includes("'nickname'"))
check('required fields include gateCode', config.includes("'gateCode'"))
check('required fields include consent', config.includes("'consent'"))

for (const token of [
  'submit-blocked',
]) check(`submit contains ${token}`, submit.includes(token))

for (const token of [
  'validateInquiryGoogleFormConfig',
  'buildInquiryGoogleFormData',
  "mode: 'no-cors'",
  '문의 접수 요청이 완료되었습니다',
  '응답 본문을 확인할 수 없으므로',
  '문의 폼 mock mode입니다',
]) check(`google submit contains ${token}`, googleSubmit.includes(token))

check('FormData appends honeypot only through mapping', googleSubmit.includes('config.fields.honeypot'))
check('honeypot normalized', validation.includes('honeypot: text(draft.honeypot)'))
check('types include honeypot on InquiryDraft', /honeypot\?:\s*string/.test(types))
check('types include config-invalid reason', types.includes('config-invalid'))
check('types include submit-blocked reason', types.includes('submit-blocked'))

for (const token of [
  'isGoogleFormFallbackReady',
  '미리보기 모드',
  '접수 가능',
  '현재 문의글 조회 기능은 제공하지 않습니다',
  '이메일은 기본 선택 입력입니다',
  'vt-inquiry-field--honeypot',
  'draft.honeypot =',
]) check(`InquiryForm contains ${token}`, component.includes(token))

for (const forbidden of [
  'localStorage.setItem',
  'sessionStorage.setItem',
  'console.log(draft.gateCode)',
  'console.info(draft.gateCode)',
  'console.warn(draft.gateCode)',
  'passwordHash',
]) check(`forbidden token absent: ${forbidden}`, !projectText.includes(forbidden))

if (exists(files.searchIndex)) {
  const searchIndex = read(files.searchIndex)
  check('search index does not expose gateCode', !searchIndex.includes('gateCode'))
  check('search index does not expose Korean password label', !searchIndex.includes('문의 비밀번호'))
}

for (const token of [
  'Google Form 만들기',
  'entry id',
  'formResponse',
  'no-cors',
  '접수 요청 완료',
  'npm run smoke:inquiry-google-form',
]) check(`inquiry google form docs contain ${token}`, docs.includes(token))

const pkg = JSON.parse(read('package.json'))
check('package has smoke:inquiry-google-form', pkg.scripts?.['smoke:inquiry-google-form'] === 'node scripts/smoke-inquiry-google-form.mjs')
check('check:launch includes smoke:inquiry-google-form', read('scripts/check-launch.mjs').includes('smoke:inquiry-google-form'))
check('launch checklist mentions smoke:inquiry-google-form', read('docs/authoring/launch-checklist.md').includes('smoke:inquiry-google-form'))

if (failures.length) {
  console.error('smoke:inquiry-google-form FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('smoke:inquiry-google-form OK')

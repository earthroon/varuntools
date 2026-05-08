import type { InquiryFormConfig, InquiryGoogleFormConfigIssue, InquiryGoogleFormConfigStatus } from '@/types/inquiry'

const ENTRY_FIELD_RE = /^entry\.\d+$/
const GOOGLE_FORM_RESPONSE_RE = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[^/]+\/formResponse(?:[?#].*)?$/
const GOOGLE_FORM_VIEW_RE = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[^/]+\/viewform(?:[?#].*)?$/

export const REQUIRED_INQUIRY_GOOGLE_FORM_FIELDS = [
  'nickname',
  'gateCode',
  'category',
  'title',
  'message',
  'consent',
] as const

export const OPTIONAL_INQUIRY_GOOGLE_FORM_FIELDS = [
  'relatedProductSlug',
  'email',
  'honeypot',
] as const

export const inquiryFormConfig: InquiryFormConfig = {
  enabled: false,
  actionUrl: '',
  fields: {
    nickname: '',
    gateCode: '',
    category: '',
    relatedProductSlug: '',
    title: '',
    message: '',
    email: '',
    consent: '',
    honeypot: '',
  },
}

function fieldValue(config: InquiryFormConfig, field: keyof InquiryFormConfig['fields']): string {
  return String(config.fields[field] || '').trim()
}

export function isGoogleFormResponseUrl(actionUrl: string): boolean {
  return GOOGLE_FORM_RESPONSE_RE.test(actionUrl.trim())
}

export function isGoogleFormViewUrl(actionUrl: string): boolean {
  return GOOGLE_FORM_VIEW_RE.test(actionUrl.trim())
}

export function isGoogleFormEntryField(value: string): boolean {
  return ENTRY_FIELD_RE.test(value.trim())
}

export function validateInquiryGoogleFormConfig(
  config: InquiryFormConfig = inquiryFormConfig,
): InquiryGoogleFormConfigStatus {
  const issues: InquiryGoogleFormConfigIssue[] = []
  const actionUrl = config.actionUrl.trim()

  if (!actionUrl) {
    issues.push({
      field: 'actionUrl',
      code: 'missing-action-url',
      message: 'Google Form formResponse action URL이 비어 있습니다.',
    })
  } else if (isGoogleFormViewUrl(actionUrl)) {
    issues.push({
      field: 'actionUrl',
      code: 'viewform-url',
      message: 'viewform URL이 아니라 formResponse URL을 입력해야 합니다.',
    })
  } else if (!isGoogleFormResponseUrl(actionUrl)) {
    issues.push({
      field: 'actionUrl',
      code: 'invalid-action-url',
      message: 'Google Form formResponse URL 형식을 확인해주세요.',
    })
  }

  for (const field of REQUIRED_INQUIRY_GOOGLE_FORM_FIELDS) {
    const value = fieldValue(config, field)
    if (!value) {
      issues.push({
        field,
        code: 'missing-entry-field',
        message: `${field} entry id가 비어 있습니다.`,
      })
    } else if (!isGoogleFormEntryField(value)) {
      issues.push({
        field,
        code: 'invalid-entry-field',
        message: `${field} entry id는 entry.1234567890 형식이어야 합니다.`,
      })
    }
  }

  for (const field of OPTIONAL_INQUIRY_GOOGLE_FORM_FIELDS) {
    const value = fieldValue(config, field)
    if (value && !isGoogleFormEntryField(value)) {
      issues.push({
        field,
        code: 'invalid-entry-field',
        message: `${field} entry id는 entry.1234567890 형식이어야 합니다.`,
      })
    }
  }

  return {
    ready: issues.length === 0,
    issues,
  }
}

export function isInquiryGoogleFormReady(config: InquiryFormConfig = inquiryFormConfig): boolean {
  return Boolean(config.enabled && validateInquiryGoogleFormConfig(config).ready)
}

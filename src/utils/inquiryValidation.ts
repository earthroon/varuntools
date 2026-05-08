import type { InquiryCategory, InquiryDraft, InquiryValidationError, InquiryValidationOptions } from '@/types/inquiry'

export const INQUIRY_CATEGORIES: { value: InquiryCategory; label: string }[] = [
  { value: 'product', label: '상품 문의' },
  { value: 'commission', label: '작업 의뢰' },
  { value: 'support', label: '이용/문제 문의' },
  { value: 'collaboration', label: '협업 제안' },
  { value: 'general', label: '기타 문의' },
]

const CATEGORY_VALUES = new Set(INQUIRY_CATEGORIES.map((category) => category.value))
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function addError(
  errors: InquiryValidationError[],
  field: InquiryValidationError['field'],
  code: string,
  message: string,
): void {
  errors.push({ field, code, message })
}

export function normalizeInquiryDraft(draft: InquiryDraft): InquiryDraft {
  return {
    nickname: text(draft.nickname),
    gateCode: text(draft.gateCode),
    category: text(draft.category) as InquiryCategory | string,
    relatedProductSlug: text(draft.relatedProductSlug),
    title: text(draft.title),
    message: text(draft.message),
    email: text(draft.email),
    consent: draft.consent === true,
    honeypot: text(draft.honeypot),
  }
}

export function validateInquiryDraft(
  draft: InquiryDraft,
  options: InquiryValidationOptions = {},
): InquiryValidationError[] {
  const value = normalizeInquiryDraft(draft)
  const errors: InquiryValidationError[] = []
  const requireNickname = options.requireNickname !== false
  const requireGateCode = options.requireGateCode !== false
  const requireEmail = options.requireEmail === true

  if (requireNickname) {
    if (!value.nickname) addError(errors, 'nickname', 'required', '닉네임을 입력해주세요.')
    else if (value.nickname.length < 2) addError(errors, 'nickname', 'too-short', '닉네임은 2자 이상이어야 합니다.')
    else if (value.nickname.length > 24) addError(errors, 'nickname', 'too-long', '닉네임은 24자 이하로 입력해주세요.')
  } else if (value.nickname.length > 24) {
    addError(errors, 'nickname', 'too-long', '닉네임은 24자 이하로 입력해주세요.')
  }

  if (requireGateCode) {
    if (!value.gateCode) addError(errors, 'gateCode', 'required', '제출 확인 코드를 입력해주세요.')
    else if (value.gateCode.length < 4) addError(errors, 'gateCode', 'too-short', '제출 확인 코드는 4자 이상이어야 합니다.')
    else if (value.gateCode.length > 40) addError(errors, 'gateCode', 'too-long', '제출 확인 코드는 40자 이하로 입력해주세요.')
  } else if (value.gateCode.length > 40) {
    addError(errors, 'gateCode', 'too-long', '제출 확인 코드는 40자 이하로 입력해주세요.')
  }

  if (!value.category) addError(errors, 'category', 'required', '문의 유형을 선택해주세요.')
  else if (!CATEGORY_VALUES.has(value.category as InquiryCategory)) addError(errors, 'category', 'invalid', '지원하지 않는 문의 유형입니다.')

  if (!value.title) addError(errors, 'title', 'required', '제목을 입력해주세요.')
  else if (value.title.length < 2) addError(errors, 'title', 'too-short', '제목은 2자 이상이어야 합니다.')
  else if (value.title.length > 80) addError(errors, 'title', 'too-long', '제목은 80자 이하로 입력해주세요.')

  if (!value.message) addError(errors, 'message', 'required', '문의 내용을 입력해주세요.')
  else if (value.message.length < 10) addError(errors, 'message', 'too-short', '문의 내용은 10자 이상이어야 합니다.')
  else if (value.message.length > 2000) addError(errors, 'message', 'too-long', '문의 내용은 2000자 이하로 입력해주세요.')

  if (requireEmail && !value.email) addError(errors, 'email', 'required', '이메일을 입력해주세요.')
  else if (value.email && !EMAIL_RE.test(value.email)) addError(errors, 'email', 'invalid', '이메일 형식을 확인해주세요.')

  if (!value.consent) addError(errors, 'consent', 'required', '문의 처리를 위한 정보 이용에 동의해주세요.')

  return errors
}

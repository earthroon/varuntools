import type { InquiryApiRequestV1, InquiryValidationResult } from './types'
import { isRateLimitedHint, isSubmitTooFast } from './rateLimit'

const CATEGORY_VALUES = new Set(['product', 'commission', 'support', 'collaboration', 'general'])
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function bool(value: unknown): boolean {
  return value === true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function addError(fieldErrors: Record<string, string>, field: string, message: string): void {
  if (!fieldErrors[field]) fieldErrors[field] = message
}

function isIsoLike(value: string): boolean {
  if (!value) return false
  const time = Date.parse(value)
  return Number.isFinite(time)
}

export function validateInquiryApiRequest(input: unknown): InquiryValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      errorCode: 'VALIDATION_FAILED',
      message: 'Request body must be a JSON object.',
      fieldErrors: { body: 'Request body must be a JSON object.' },
    }
  }

  const fieldErrors: Record<string, string> = {}

  if (input.version !== 1) addError(fieldErrors, 'version', 'version must be 1.')

  const submittedAt = text(input.submittedAt)
  if (!isIsoLike(submittedAt)) addError(fieldErrors, 'submittedAt', 'submittedAt must be an ISO date string.')

  const sourcePath = text(input.sourcePath)
  if (!sourcePath) addError(fieldErrors, 'sourcePath', 'sourcePath is required.')

  const draftInput = input.draft
  if (!isRecord(draftInput)) {
    addError(fieldErrors, 'draft', 'draft is required.')
  }

  const draft = isRecord(draftInput) ? {
    nickname: text(draftInput.nickname),
    gateCode: text(draftInput.gateCode),
    category: text(draftInput.category),
    relatedProductSlug: text(draftInput.relatedProductSlug),
    title: text(draftInput.title),
    message: text(draftInput.message),
    email: text(draftInput.email),
    consent: bool(draftInput.consent),
    honeypot: text(draftInput.honeypot),
  } : {
    nickname: '',
    gateCode: '',
    category: '',
    relatedProductSlug: '',
    title: '',
    message: '',
    email: '',
    consent: false,
    honeypot: '',
  }

  if (draft.honeypot) {
    return {
      ok: false,
      errorCode: 'HONEYPOT_TRIGGERED',
      message: 'Inquiry request was blocked.',
      fieldErrors: { form: 'HONEYPOT_TRIGGERED' },
    }
  }

  if (!draft.nickname) addError(fieldErrors, 'nickname', 'nickname is required.')
  else if (draft.nickname.length < 2) addError(fieldErrors, 'nickname', 'nickname must be at least 2 characters.')
  else if (draft.nickname.length > 24) addError(fieldErrors, 'nickname', 'nickname must be 24 characters or less.')

  if (!draft.gateCode) addError(fieldErrors, 'gateCode', 'gateCode is required.')
  else if (draft.gateCode.length < 4) addError(fieldErrors, 'gateCode', 'gateCode must be at least 4 characters.')
  else if (draft.gateCode.length > 40) addError(fieldErrors, 'gateCode', 'gateCode must be 40 characters or less.')

  if (!draft.category) addError(fieldErrors, 'category', 'category is required.')
  else if (!CATEGORY_VALUES.has(draft.category)) addError(fieldErrors, 'category', 'category is not supported.')

  if (!draft.title) addError(fieldErrors, 'title', 'title is required.')
  else if (draft.title.length < 2) addError(fieldErrors, 'title', 'title must be at least 2 characters.')
  else if (draft.title.length > 80) addError(fieldErrors, 'title', 'title must be 80 characters or less.')

  if (!draft.message) addError(fieldErrors, 'message', 'message is required.')
  else if (draft.message.length < 10) addError(fieldErrors, 'message', 'message must be at least 10 characters.')
  else if (draft.message.length > 2000) addError(fieldErrors, 'message', 'message must be 2000 characters or less.')

  if (draft.email && !EMAIL_RE.test(draft.email)) addError(fieldErrors, 'email', 'email is invalid.')
  if (!draft.consent) addError(fieldErrors, 'consent', 'consent is required.')

  const value: InquiryApiRequestV1 = {
    version: 1,
    submittedAt,
    sourcePath,
    sourceUrl: text(input.sourceUrl) || undefined,
    draft,
    context: isRecord(input.context)
      ? {
          ref: text(input.context.ref) || undefined,
          categoryFromQuery: text(input.context.categoryFromQuery) || undefined,
          prefilled: input.context.prefilled === true,
        }
      : undefined,
    clientGuard: isRecord(input.clientGuard)
      ? {
          formMountedAt: typeof input.clientGuard.formMountedAt === 'number' ? input.clientGuard.formMountedAt : undefined,
          submitStartedAt: typeof input.clientGuard.submitStartedAt === 'number' ? input.clientGuard.submitStartedAt : undefined,
          minimumSubmitDelayMs: typeof input.clientGuard.minimumSubmitDelayMs === 'number' ? input.clientGuard.minimumSubmitDelayMs : undefined,
          fingerprint: text(input.clientGuard.fingerprint) || undefined,
        }
      : undefined,
  }

  if (isSubmitTooFast(value)) {
    return {
      ok: false,
      errorCode: 'SUBMIT_TOO_FAST',
      message: 'Inquiry request was submitted too quickly.',
      fieldErrors: { form: 'SUBMIT_TOO_FAST' },
    }
  }

  if (isRateLimitedHint()) {
    return {
      ok: false,
      errorCode: 'RATE_LIMITED',
      message: 'Too many inquiry requests. Please retry later.',
    }
  }

  if (Object.keys(fieldErrors).length) {
    return {
      ok: false,
      errorCode: 'VALIDATION_FAILED',
      message: 'Inquiry request validation failed.',
      fieldErrors,
    }
  }

  return { ok: true, value }
}

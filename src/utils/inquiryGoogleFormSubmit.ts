import {
  inquiryFormConfig,
  isInquiryGoogleFormReady,
  validateInquiryGoogleFormConfig,
} from '@/config/inquiryForm'
import type {
  InquiryDraft,
  InquiryFormConfig,
  InquiryPayloadV1,
  InquirySubmitResult,
} from '@/types/inquiry'
import { normalizeInquiryDraft } from './inquiryValidation'

function appendIfMapped(formData: FormData, key: string | undefined, value: string | boolean): void {
  if (!key || !key.trim()) return
  formData.append(key, String(value))
}

export function buildInquiryGoogleFormData(
  draft: InquiryDraft,
  config: InquiryFormConfig = inquiryFormConfig,
): FormData {
  const value = normalizeInquiryDraft(draft)
  const formData = new FormData()

  appendIfMapped(formData, config.fields.nickname, value.nickname)
  appendIfMapped(formData, config.fields.gateCode, value.gateCode)
  appendIfMapped(formData, config.fields.category, value.category)
  appendIfMapped(formData, config.fields.relatedProductSlug, value.relatedProductSlug || '')
  appendIfMapped(formData, config.fields.title, value.title)
  appendIfMapped(formData, config.fields.message, value.message)
  appendIfMapped(formData, config.fields.email, value.email || '')
  appendIfMapped(formData, config.fields.consent, value.consent)
  appendIfMapped(formData, config.fields.honeypot, value.honeypot || '')

  return formData
}

export async function submitInquiryToGoogleForm(
  payload: InquiryPayloadV1,
  draft: InquiryDraft,
  config: InquiryFormConfig = inquiryFormConfig,
  options: { fallbackUsed?: boolean } = {},
): Promise<InquirySubmitResult> {
  if (!config.enabled) {
    return {
      ok: true,
      mode: 'mock',
      target: 'mock',
      fallbackUsed: Boolean(options.fallbackUsed),
      persisted: false,
      storageMode: 'mock',
      payload,
      message: '문의 폼 mock mode입니다. 실제 제출은 발생하지 않았습니다.',
    }
  }

  if (!isInquiryGoogleFormReady(config)) {
    const configStatus = validateInquiryGoogleFormConfig(config)
    return {
      ok: false,
      reason: 'config-invalid',
      target: 'google-form',
      fallbackUsed: Boolean(options.fallbackUsed),
      errorCode: 'CONFIG_INVALID',
      payload,
      errors: configStatus.issues.map((issue) => ({
        field: 'form',
        code: issue.code,
        message: issue.message,
      })),
    }
  }

  try {
    await fetch(config.actionUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: buildInquiryGoogleFormData(draft, config),
    })

    return {
      ok: true,
      mode: 'google-form',
      target: 'google-form',
      fallbackUsed: Boolean(options.fallbackUsed),
      persisted: false,
      storageMode: 'google-form',
      payload,
      message: options.fallbackUsed
        ? '문의가 예비 접수 경로로 전송되었습니다. 확인까지 시간이 조금 더 걸릴 수 있습니다.'
        : '문의 접수 요청이 완료되었습니다. Google Form no-cors 제출은 응답 본문을 확인할 수 없으므로, 운영자는 Google Sheet에서 최종 접수 여부를 확인합니다.',
    }
  } catch {
    return {
      ok: false,
      reason: 'submit-failed',
      target: 'google-form',
      fallbackUsed: Boolean(options.fallbackUsed),
      errorCode: options.fallbackUsed ? 'FALLBACK_FAILED' : 'SERVER_ERROR',
      payload,
      errors: [
        {
          field: 'form',
          code: options.fallbackUsed ? 'fallback-failed' : 'submit-failed',
          message: options.fallbackUsed
            ? '예비 접수 경로도 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'
            : '문의 접수 요청에 실패했습니다. 잠시 후 다시 시도해주세요.',
        },
      ],
    }
  }
}

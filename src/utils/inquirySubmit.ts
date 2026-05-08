import { inquiryFormConfig } from '@/config/inquiryForm'
import { inquirySubmitStrategy, inquiryWorkerApiConfig } from '@/config/inquiryWorkerApi'
import type {
  InquiryClientGuardSnapshot,
  InquiryDraft,
  InquiryFormConfig,
  InquiryPayloadV1,
  InquiryPrefillContext,
  InquirySubmitResult,
  InquirySubmitStrategy,
  InquiryValidationOptions,
  InquiryWorkerApiConfig,
} from '@/types/inquiry'
import { normalizeInquiryDraft, validateInquiryDraft } from './inquiryValidation'
import { submitInquiryToGoogleForm } from './inquiryGoogleFormSubmit'
import { submitInquiryToWorkerApi } from './inquiryWorkerSubmit'

export { buildInquiryGoogleFormData } from './inquiryGoogleFormSubmit'

export function createInquiryPayloadV1(input: {
  draft: InquiryDraft
  sourcePath: string
  sourceUrl?: string
  context?: InquiryPrefillContext
  submittedAt?: string
}): InquiryPayloadV1 {
  return {
    version: 1,
    submittedAt: input.submittedAt || new Date().toISOString(),
    sourcePath: input.sourcePath,
    sourceUrl: input.sourceUrl,
    draft: normalizeInquiryDraft(input.draft),
    context: input.context,
  }
}

function buildWorkerConfig(strategy: InquirySubmitStrategy): InquiryWorkerApiConfig {
  return {
    ...inquiryWorkerApiConfig,
    endpoint: strategy.workerEndpoint || inquiryWorkerApiConfig.endpoint,
  }
}

function canFallbackToGoogleForm(result: InquirySubmitResult, strategy: InquirySubmitStrategy): boolean {
  if (result.ok) return false
  if (result.target !== 'worker') return false
  if (!strategy.allowGoogleFormFallback) return false
  if (strategy.fallbackPolicy !== 'google-form-on-worker-error') return false

  return result.errorCode === 'WORKER_UNAVAILABLE' || result.errorCode === 'SERVER_ERROR'
}

export async function submitInquiry(
  draft: InquiryDraft,
  config: InquiryFormConfig = inquiryFormConfig,
  validationOptions: InquiryValidationOptions = {},
  payloadContext?: {
    sourcePath?: string
    sourceUrl?: string
    context?: InquiryPrefillContext
    clientGuard?: InquiryClientGuardSnapshot
  },
  strategy: InquirySubmitStrategy = inquirySubmitStrategy,
): Promise<InquirySubmitResult> {
  const normalizedDraft = normalizeInquiryDraft(draft)
  const payload = createInquiryPayloadV1({
    draft: normalizedDraft,
    sourcePath: payloadContext?.sourcePath || '/inquiry',
    sourceUrl: payloadContext?.sourceUrl,
    context: payloadContext?.context,
  })

  if (normalizedDraft.honeypot) {
    return {
      ok: false,
      reason: 'submit-blocked',
      target: strategy.primaryTarget,
      fallbackUsed: false,
      errorCode: 'HONEYPOT_TRIGGERED',
      payload,
      errors: [
        {
          field: 'form',
          code: 'INQUIRY_HONEYPOT_TRIGGERED',
          message: '문의 접수 요청이 차단되었습니다.',
        },
      ],
    }
  }

  const errors = validateInquiryDraft(normalizedDraft, validationOptions)

  if (errors.length) {
    return {
      ok: false,
      reason: 'validation-failed',
      target: strategy.primaryTarget,
      fallbackUsed: false,
      errorCode: 'VALIDATION_FAILED',
      payload,
      errors,
    }
  }

  if (strategy.primaryTarget === 'mock') {
    return {
      ok: true,
      mode: 'mock',
      target: 'mock',
      fallbackUsed: false,
      persisted: false,
      storageMode: 'mock',
      payload,
      message: '문의 폼 mock mode입니다. 실제 제출은 발생하지 않았습니다.',
    }
  }

  if (strategy.primaryTarget === 'google-form') {
    return submitInquiryToGoogleForm(payload, normalizedDraft, config, { fallbackUsed: false })
  }

  const workerResult = await submitInquiryToWorkerApi(
    payload,
    buildWorkerConfig(strategy),
    payloadContext?.clientGuard,
  )

  if (workerResult.ok) return workerResult

  if (canFallbackToGoogleForm(workerResult, strategy)) {
    return submitInquiryToGoogleForm(payload, normalizedDraft, config, { fallbackUsed: true })
  }

  return workerResult
}

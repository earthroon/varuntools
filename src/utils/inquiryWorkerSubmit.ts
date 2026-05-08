import type {
  InquiryApiRequestV1,
  InquiryApiResponse,
  InquiryClientGuardSnapshot,
  InquiryPayloadV1,
  InquirySubmitResult,
  InquiryValidationError,
  InquiryWorkerApiConfig,
} from '@/types/inquiry'
import { inquiryWorkerApiConfig, isInquiryWorkerApiReady } from '@/config/inquiryWorkerApi'

function fieldErrorsToValidationErrors(fieldErrors: Record<string, string> | undefined): InquiryValidationError[] {
  if (!fieldErrors) return []
  return Object.entries(fieldErrors).map(([field, message]) => ({
    field: field === 'form' ? 'form' : field as InquiryValidationError['field'],
    code: field,
    message,
  }))
}

export function buildInquiryApiRequestV1(
  payload: InquiryPayloadV1,
  clientGuard?: InquiryClientGuardSnapshot,
): InquiryApiRequestV1 {
  return {
    ...payload,
    clientGuard,
  }
}

export async function submitInquiryToWorkerApi(
  payload: InquiryPayloadV1,
  config: InquiryWorkerApiConfig = inquiryWorkerApiConfig,
  clientGuard?: InquiryClientGuardSnapshot,
): Promise<InquirySubmitResult> {
  if (!isInquiryWorkerApiReady(config)) {
    return {
      ok: false,
      reason: 'config-invalid',
      target: 'worker',
      fallbackUsed: false,
      errorCode: 'CONFIG_INVALID',
      payload,
      errors: [
        {
          field: 'form',
          code: 'worker-api-not-configured',
          message: 'Worker 문의 API endpoint가 설정되어 있지 않습니다.',
        },
      ],
    }
  }

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildInquiryApiRequestV1(payload, clientGuard)),
    })
    const data = await response.json() as InquiryApiResponse

    if (data.ok) {
      return {
        ok: true,
        mode: 'worker',
        target: 'worker',
        fallbackUsed: false,
        payload,
        inquiryId: data.inquiryId,
        persisted: data.persisted,
        storageMode: data.storageMode,
        notification: data.notification,
        apiResponse: data,
        message: '문의가 접수되었습니다. 검토 후 필요한 경우 입력해주신 연락처로 회신드릴게요.',
      }
    }

    const validationErrors = fieldErrorsToValidationErrors(data.fieldErrors)
    const isValidationLike = ['VALIDATION_FAILED', 'HONEYPOT_TRIGGERED', 'SUBMIT_TOO_FAST', 'RATE_LIMITED'].includes(data.errorCode)

    return {
      ok: false,
      reason: data.errorCode === 'VALIDATION_FAILED'
        ? 'validation-failed'
        : isValidationLike
          ? 'submit-blocked'
          : 'submit-failed',
      target: 'worker',
      fallbackUsed: false,
      errorCode: data.errorCode,
      payload,
      errors: validationErrors.length
        ? validationErrors
        : [
            {
              field: 'form',
              code: data.errorCode,
              message: data.message,
            },
          ],
    }
  } catch {
    return {
      ok: false,
      reason: 'submit-failed',
      target: 'worker',
      fallbackUsed: false,
      errorCode: 'WORKER_UNAVAILABLE',
      payload,
      errors: [
        {
          field: 'form',
          code: 'worker-submit-failed',
          message: 'Worker 문의 API 접수 요청에 실패했습니다.',
        },
      ],
    }
  }
}

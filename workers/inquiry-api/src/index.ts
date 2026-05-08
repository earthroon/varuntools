import { jsonResponse, optionsResponse } from './http'
import { sha256Hex } from './id'
import { createInquiryStorage } from './storage'
import { dispatchInquiryNotification } from './notification'
import { validateInquiryApiRequest } from './validation'
import type { Env } from './worker-runtime'
import type { InquiryApiErrorCode, InquiryApiResponse } from './types'

function errorResponse(
  request: Request,
  env: Env,
  status: number,
  errorCode: InquiryApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): Response {
  const body: InquiryApiResponse = { ok: false, errorCode, message, fieldErrors }
  return jsonResponse(request, env, body, { status })
}

async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('Content-Type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('UNSUPPORTED_CONTENT_TYPE')
  }
  return request.json()
}

async function requestIpHash(request: Request): Promise<string | undefined> {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || ''
  if (!ip) return undefined
  return sha256Hex(ip)
}

async function handleInquiryPost(request: Request, env: Env): Promise<Response> {
  let body: unknown
  try {
    body = await readJson(request)
  } catch {
    return errorResponse(request, env, 400, 'VALIDATION_FAILED', 'Content-Type must be application/json.', {
      body: 'Content-Type must be application/json.',
    })
  }

  const validation = validateInquiryApiRequest(body)
  if (!validation.ok) {
    const status = validation.errorCode === 'HONEYPOT_TRIGGERED'
      ? 400
      : validation.errorCode === 'SUBMIT_TOO_FAST'
        ? 429
        : validation.errorCode === 'RATE_LIMITED'
          ? 429
          : 400
    return errorResponse(request, env, status, validation.errorCode, validation.message, validation.fieldErrors)
  }

  try {
    const storage = createInquiryStorage(env)
    const stored = await storage.insertInquiry({
      request: validation.value,
      receivedAt: new Date().toISOString(),
      userAgent: request.headers.get('User-Agent') || undefined,
      ipHash: await requestIpHash(request),
    })

    const notification = stored.persisted
      ? await dispatchInquiryNotification({ env, storage, request: validation.value, stored })
      : { attempted: false, ok: true, channels: [] as [] }

    const response: InquiryApiResponse = {
      ok: true,
      inquiryId: stored.inquiryId,
      status: 'received',
      persisted: stored.persisted,
      storageMode: stored.storageMode,
      inquiryStatus: stored.status,
      priority: stored.priority,
      notification,
      message: stored.persisted
        ? 'Inquiry request was received, validated, persisted, and queued for notification workflow.'
        : 'Inquiry request was received and validated in mock storage mode. It was not persisted.',
    }

    return jsonResponse(request, env, response, { status: stored.persisted ? 201 : 202 })
  } catch {
    return errorResponse(request, env, 500, 'SERVER_ERROR', 'Inquiry storage failed.')
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname.replace(/\/+$/, '') || '/'

    if (request.method === 'OPTIONS') return optionsResponse(request, env)
    if (pathname !== '/api/inquiries') return errorResponse(request, env, 404, 'SERVER_ERROR', 'Unknown inquiry API route.')
    if (request.method !== 'POST') return errorResponse(request, env, 405, 'SERVER_ERROR', 'Use POST /api/inquiries.')

    try {
      return await handleInquiryPost(request, env)
    } catch {
      return errorResponse(request, env, 500, 'SERVER_ERROR', 'Inquiry API server error.')
    }
  },
}

import { jsonResponse, preflightResponse } from './http'
import { sha256Hex } from './id'
import { createInquiryStorage } from './storage'
import { validateInquiryApiRequest } from './validation'
import type { InquiryApiRequestV1 } from './types'
import type { Env } from './worker-runtime'

function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown'
}

async function parseRequest(request: Request): Promise<InquiryApiRequestV1> {
  return await request.json() as InquiryApiRequestV1
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return preflightResponse(env, request)
    if (url.pathname !== '/api/inquiries') return jsonResponse(env, request, { ok: false, errorCode: 'SERVER_ERROR', message: 'Not found.' }, { status: 404 })
    if (request.method !== 'POST') return jsonResponse(env, request, { ok: false, errorCode: 'SERVER_ERROR', message: 'Method not allowed.' }, { status: 405 })

    try {
      const body = await parseRequest(request)
      const validation = validateInquiryApiRequest(body)
      if (!validation.ok) return jsonResponse(env, request, validation, { status: 400 })

      const requestIpHash = await sha256Hex(getClientIp(request))
      const payloadJson = JSON.stringify(body)
      const storage = createInquiryStorage(env)
      const stored = await storage.insertInquiry({ request: body, receivedAt: new Date().toISOString(), requestIpHash, payloadJson })

      return jsonResponse(env, request, {
        ok: true,
        inquiryId: stored.inquiryId,
        status: 'received',
        persisted: stored.persisted,
        storageMode: stored.storageMode,
        inquiryStatus: stored.status,
        priority: stored.priority,
        message: '문의가 접수되었습니다.',
      })
    } catch (error) {
      console.error('Inquiry storage failed.', error)
      return jsonResponse(env, request, { ok: false, errorCode: 'SERVER_ERROR', message: 'Inquiry storage failed.' }, { status: 500 })
    }
  },
}

/*
 * CMS-D1-017A-R2Z-R1W-R4-LIVE-R2-F6-F40
 * Inquiry notification workflow dispatch token reseal.
 * dispatchInquiryNotification
 * stored.persisted
 * notification,
 */

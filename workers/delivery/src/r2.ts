import type { ApiErrorCode, Env, ProductDeliverable } from './types'

export class PrivateDeliveryError extends Error {
  status: number
  code: ApiErrorCode

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message)
    this.name = 'PrivateDeliveryError'
    this.status = status
    this.code = code
  }
}

export async function getPrivateDeliverableObject(
  env: Env,
  deliverable: ProductDeliverable,
): Promise<R2ObjectBody> {
  if (!env.VARUNTOOLS_PRODUCT_BUCKET) {
    throw new PrivateDeliveryError(501, 'R2_BUCKET_NOT_CONFIGURED', 'Private R2 bucket binding is not configured.')
  }
  if (!deliverable.r2Key) {
    throw new PrivateDeliveryError(502, 'R2_OBJECT_MISSING', 'Deliverable is missing its private R2 key.')
  }

  const object = await env.VARUNTOOLS_PRODUCT_BUCKET.get(deliverable.r2Key)
  if (!object) {
    throw new PrivateDeliveryError(502, 'R2_OBJECT_MISSING', 'Private R2 object was not found.')
  }

  return object
}

function safeAttachmentName(fileName: string): string {
  return fileName.replace(/["\r\n]/g, '').trim() || 'download.bin'
}

export function buildDownloadHeaders(deliverable: ProductDeliverable, object?: R2ObjectBody): Headers {
  const headers = new Headers()
  headers.set('Content-Type', deliverable.contentType || 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="${safeAttachmentName(deliverable.fileName)}"`)
  headers.set('Cache-Control', 'private, no-store')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Varun-Delivery', 'private-r2')

  const size = deliverable.sizeBytes ?? object?.size
  if (typeof size === 'number' && Number.isFinite(size)) headers.set('Content-Length', String(size))
  if (object?.etag) headers.set('ETag', object.etag)

  return headers
}

export const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])

export const FILE_MIME_TYPES = new Set([
  'application/pdf',
])

export const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
])

export const GOOGLE_NATIVE_MIME_TYPES = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.drawing',
])

export function extFromMime(mimeType, fallback = 'bin') {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'application/pdf': 'pdf',
  }
  return map[String(mimeType ?? '').toLowerCase()] || fallback
}

export function extFromFileName(fileName) {
  const match = String(fileName ?? '').trim().match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : ''
}

export function assertAllowedAssetMime({ type, mimeType, assetId }) {
  const normalizedType = String(type ?? '').trim()
  const normalizedMime = String(mimeType ?? '').trim().toLowerCase()

  if (GOOGLE_NATIVE_MIME_TYPES.has(normalizedMime)) {
    throw new Error(`Google-native file is not supported as a public asset: ${assetId}`)
  }

  if (normalizedType === 'image' && !IMAGE_MIME_TYPES.has(normalizedMime)) {
    throw new Error(`Unsupported image MIME for ${assetId}: ${normalizedMime}`)
  }

  if (normalizedType === 'file' && !FILE_MIME_TYPES.has(normalizedMime)) {
    throw new Error(`Unsupported file MIME for ${assetId}: ${normalizedMime}`)
  }

  if (normalizedType === 'video' && !VIDEO_MIME_TYPES.has(normalizedMime)) {
    throw new Error(`Unsupported video MIME for ${assetId}: ${normalizedMime}`)
  }
}

export const VARUNTOOLS_PUBLIC_R2B_RUNTIME_MANIFEST_SCHEMA = 'cms-207m-public-asset-manifest@2'
export const VARUNTOOLS_PUBLIC_R2B_RUNTIME_REVISION = 'VARUNTOOLS-PUBLIC-R2B'

const CONTENT_ASSET_SEMANTIC_PATH = /^\/assets\/content\//i
const DIRECT_R2_URL = /^https?:\/\/[^/]*(?:\.r2\.dev|\.r2\.cloudflarestorage\.com)(?:\/|$)/i
const VARUNTOOLS_STATIC_CONTENT_URL = /^https?:\/\/(?:www\.)?varun\.tools\/assets\/content\//i

function text(value) {
  return String(value ?? '').trim()
}

function nullableText(value) {
  const normalized = text(value)
  return normalized || null
}

function positiveFiniteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function nullableDuration(value) {
  const normalized = text(value)
  return /^\d+$/.test(normalized) && normalized !== '0' ? normalized : null
}

export function isVideoSourceAsset(asset) {
  return text(asset?.mime).toLowerCase().startsWith('video/')
    || text(asset?.role).toLowerCase() === 'video'
    || text(asset?.media?.mediaKind).toLowerCase() === 'video'
}

export function assertSemanticContentAssetPath(value, code, assetId) {
  const candidate = text(value)
  if (DIRECT_R2_URL.test(candidate)) throw new Error(`E_VARUNTOOLS_R2B_PLAYBACK_DIRECT_R2_FORBIDDEN:${assetId}`)
  if (VARUNTOOLS_STATIC_CONTENT_URL.test(candidate)) throw new Error(`E_VARUNTOOLS_R2B_SAME_ORIGIN_STATIC_FALLTHROUGH:${assetId}`)
  if (!candidate || !CONTENT_ASSET_SEMANTIC_PATH.test(candidate) || /^https?:\/\//i.test(candidate)) {
    throw new Error(`${code}:${assetId}:${candidate || 'missing'}`)
  }
  return candidate
}

function baseRuntimeAsset(asset) {
  return {
    schemaVersion: 'varuntools-public-runtime-asset@2',
    assetId: text(asset?.assetId),
    pageId: nullableText(asset?.pageId),
    role: text(asset?.role),
    filename: text(asset?.filename),
    mime: text(asset?.mime),
    presentation: {
      posterAssetId: nullableText(asset?.presentation?.posterAssetId),
      posterPublicPath: nullableText(asset?.presentation?.posterPublicPath),
    },
    media: asset?.media ?? null,
    authority: asset?.authority ?? null,
  }
}

function unavailableVideoDelivery(playbackState, reason) {
  return {
    class: 'none',
    state: 'unavailable',
    publicPath: null,
    renditionId: null,
    sizeBytes: null,
    hash: null,
    container: null,
    videoCodec: null,
    audioCodec: null,
    width: null,
    height: null,
    durationMs: null,
    policyRevision: null,
    sourceIdentityDigest: null,
    producerPlaybackState: playbackState,
    reason,
  }
}

function projectVideoDelivery(asset) {
  const assetId = text(asset?.assetId)
  const playback = asset?.playback
  const state = text(playback?.state).toLowerCase()

  if (!playback || !state || state === 'missing') {
    return unavailableVideoDelivery(state || 'missing', 'playback_rendition_missing')
  }
  if (state === 'stale') return unavailableVideoDelivery('stale', 'playback_rendition_stale')
  if (state === 'unsupported') return unavailableVideoDelivery('unsupported', 'playback_rendition_unsupported')
  if (state !== 'ready') throw new Error(`E_VARUNTOOLS_R2B_PLAYBACK_STATE_INVALID:${assetId}:${state}`)

  const sourcePath = text(asset?.publicPath)
  const playbackPath = assertSemanticContentAssetPath(
    playback?.publicPath,
    'E_VARUNTOOLS_R2B_PLAYBACK_PATH_INVALID',
    assetId,
  )
  if (sourcePath && playbackPath === sourcePath) {
    throw new Error(`E_VARUNTOOLS_R2B_PLAYBACK_EQUALS_SOURCE:${assetId}`)
  }

  const renditionId = text(playback?.variantId)
  if (!renditionId) throw new Error(`E_VARUNTOOLS_R2B_PLAYBACK_RENDITION_ID_MISSING:${assetId}`)
  if (renditionId === assetId) throw new Error(`E_VARUNTOOLS_R2B_PLAYBACK_SOURCE_IDENTITY_COLLISION:${assetId}`)

  const sizeBytes = positiveFiniteOrNull(playback?.sizeBytes)
  if (sizeBytes == null) throw new Error(`E_VARUNTOOLS_R2B_PLAYBACK_SIZE_INVALID:${assetId}`)

  return {
    class: 'playback_rendition',
    state: 'ready',
    publicPath: playbackPath,
    renditionId,
    sizeBytes,
    hash: nullableText(playback?.playbackHash),
    container: nullableText(playback?.container),
    videoCodec: nullableText(playback?.videoCodec),
    audioCodec: nullableText(playback?.audioCodec),
    width: positiveFiniteOrNull(playback?.width),
    height: positiveFiniteOrNull(playback?.height),
    durationMs: nullableDuration(playback?.durationMs),
    policyRevision: nullableText(playback?.policyRevision),
    sourceIdentityDigest: nullableText(playback?.sourceIdentityDigest),
    producerPlaybackState: 'ready',
    reason: null,
  }
}

function projectDirectDelivery(asset) {
  const assetId = text(asset?.assetId)
  const publicPath = assertSemanticContentAssetPath(
    asset?.publicPath,
    'E_VARUNTOOLS_R2B_DIRECT_ASSET_PATH_INVALID',
    assetId,
  )
  return {
    class: 'direct_asset',
    state: 'ready',
    publicPath,
    renditionId: null,
    sizeBytes: positiveFiniteOrNull(asset?.sizeBytes),
    hash: nullableText(asset?.hash),
    container: null,
    videoCodec: null,
    audioCodec: null,
    width: null,
    height: null,
    durationMs: null,
    policyRevision: null,
    sourceIdentityDigest: null,
    producerPlaybackState: 'unsupported',
    reason: null,
  }
}

export function projectPublicRuntimeAsset(asset) {
  const assetId = text(asset?.assetId)
  if (!assetId) throw new Error('E_VARUNTOOLS_R2B_ASSET_ID_MISSING')
  const runtime = baseRuntimeAsset(asset)
  runtime.delivery = isVideoSourceAsset(asset) ? projectVideoDelivery(asset) : projectDirectDelivery(asset)
  return runtime
}

import publicAssetManifestFile from '@/content/generated/publicAssetManifest.generated.json'
import { resolveContentAsset } from '@/content/assetRegistry'
import type {
  PublicAssetManifest,
  PublicRuntimeAssetProjection,
} from '@/content/publicProjectionTypes'

const publicAssetManifest = publicAssetManifestFile as PublicAssetManifest
const CONTENT_ASSET_SEMANTIC_PATH = /^\/assets\/content\//i
const DIRECT_R2_URL = /^https?:\/\/[^/]*(?:\.r2\.dev|\.r2\.cloudflarestorage\.com)(?:\/|$)/i
const VARUNTOOLS_STATIC_CONTENT_URL = /^https?:\/\/(?:www\.)?varun\.tools\/assets\/content\//i

function positiveFinite(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : undefined
}

function durationSecondsFromDecimalMilliseconds(value: string | null | undefined): number | undefined {
  const text = String(value ?? '').trim()
  if (!/^\d+$/.test(text)) return undefined

  let milliseconds: bigint
  try {
    milliseconds = BigInt(text)
  } catch {
    return undefined
  }

  if (milliseconds <= 0n || milliseconds > BigInt(Number.MAX_SAFE_INTEGER)) return undefined
  return Number(milliseconds) / 1000
}

type ProjectedRuntimeAssetResolution = {
  found: boolean
  semanticPath: string
  url: string
  reason: string
}

function resolveProjectedRuntimeAssetPath(
  value: string | null | undefined,
  emptyReason: string,
): ProjectedRuntimeAssetResolution {
  const semanticPath = String(value ?? '').trim()
  if (!semanticPath) {
    return {
      found: false,
      semanticPath: '',
      url: '',
      reason: emptyReason,
    }
  }

  if (!CONTENT_ASSET_SEMANTIC_PATH.test(semanticPath)) {
    return {
      found: false,
      semanticPath,
      url: '',
      reason: 'asset_projection_public_path_invalid',
    }
  }

  const resolved = resolveContentAsset({ source: semanticPath })
  const url = String(resolved.url ?? '').trim()

  if (
    !resolved.found ||
    resolved.kind !== 'content_asset' ||
    resolved.reason !== 'content_asset_proxy' ||
    !url
  ) {
    return {
      found: false,
      semanticPath,
      url: '',
      reason: 'asset_projection_proxy_resolution_failed',
    }
  }

  if (url === semanticPath || CONTENT_ASSET_SEMANTIC_PATH.test(url) || VARUNTOOLS_STATIC_CONTENT_URL.test(url)) {
    return {
      found: false,
      semanticPath,
      url: '',
      reason: 'asset_projection_same_origin_static_fallthrough',
    }
  }

  if (DIRECT_R2_URL.test(url)) {
    return {
      found: false,
      semanticPath,
      url: '',
      reason: 'asset_projection_direct_r2_url_forbidden',
    }
  }

  return {
    found: true,
    semanticPath,
    url,
    reason: '',
  }
}

export function getPublicAssetProjection(assetId: string | null | undefined): PublicRuntimeAssetProjection | null {
  const id = String(assetId ?? '').trim()
  if (!id) return null
  if (publicAssetManifest.schemaVersion !== 'cms-207m-public-asset-manifest@2') return null
  if (publicAssetManifest.runtimeRevision !== 'VARUNTOOLS-PUBLIC-R2B') return null
  return publicAssetManifest.assets?.[id] ?? null
}

export function resolvePublicVideoAssetProjection(assetId: string | null | undefined): {
  found: boolean
  asset: PublicRuntimeAssetProjection | null
  src: string
  poster: string
  streamManifestUrl?: string
  manifestWidth?: number
  manifestHeight?: number
  duration?: number
  sourceAuthority: 'playback_segment_stream' | 'playback_rendition' | 'none'
  playbackState: string
  reason: string
} {
  const id = String(assetId ?? '').trim()
  if (!id) {
    return {
      found: false,
      asset: null,
      src: '',
      poster: '',
      sourceAuthority: 'none',
      playbackState: 'missing',
      reason: 'asset_id_missing',
    }
  }

  const asset = getPublicAssetProjection(id)
  if (!asset) {
    return {
      found: false,
      asset: null,
      src: '',
      poster: '',
      sourceAuthority: 'none',
      playbackState: 'missing',
      reason: 'asset_projection_missing',
    }
  }

  const posterResolution = resolveProjectedRuntimeAssetPath(
    asset.presentation?.posterPublicPath,
    'asset_projection_poster_missing',
  )
  const delivery = asset.delivery
  const readyPlayback = delivery?.class === 'playback_segment_stream'
    && delivery?.state === 'ready'
    && delivery?.producerPlaybackState === 'ready'

  const metadata = {
    manifestWidth: positiveFinite(readyPlayback ? delivery?.width : asset.media?.width),
    manifestHeight: positiveFinite(readyPlayback ? delivery?.height : asset.media?.height),
    duration: durationSecondsFromDecimalMilliseconds(readyPlayback ? delivery?.durationMs : asset.media?.durationMs),
  }

  if (!readyPlayback) {
    return {
      found: false,
      asset,
      src: '',
      poster: posterResolution.found ? posterResolution.url : '',
      ...metadata,
      sourceAuthority: 'none',
      playbackState: delivery?.producerPlaybackState || 'missing',
      reason: delivery?.reason || 'playback_rendition_unavailable',
    }
  }

  const srcResolution = resolveProjectedRuntimeAssetPath(
    delivery.manifestPublicPath,
    'asset_playback_public_path_missing',
  )
  if (!srcResolution.found) {
    return {
      found: false,
      asset,
      src: '',
      poster: posterResolution.found ? posterResolution.url : '',
      ...metadata,
      sourceAuthority: 'none',
      playbackState: delivery.producerPlaybackState,
      reason: `playback_required:${srcResolution.reason}`,
    }
  }

  return {
    found: true,
    asset,
    src: '',
    streamManifestUrl: srcResolution.url,
    poster: posterResolution.found ? posterResolution.url : '',
    ...metadata,
    sourceAuthority: 'playback_rendition',
    playbackState: delivery.producerPlaybackState,
    reason: 'playback_derivative',
  }
}

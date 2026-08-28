import publicAssetManifestFile from '@/content/generated/publicAssetManifest.generated.json'
import type {
  PublicAssetManifest,
  PublicAssetProjection,
} from '@/content/publicProjectionTypes'

const publicAssetManifest = publicAssetManifestFile as PublicAssetManifest

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

export function getPublicAssetProjection(assetId: string | null | undefined): PublicAssetProjection | null {
  const id = String(assetId ?? '').trim()
  if (!id) return null
  if (publicAssetManifest.schemaVersion !== 'cms-207m-public-asset-manifest@1') return null
  return publicAssetManifest.assets?.[id] ?? null
}

export function resolvePublicVideoAssetProjection(assetId: string | null | undefined): {
  found: boolean
  asset: PublicAssetProjection | null
  src: string
  poster: string
  manifestWidth?: number
  manifestHeight?: number
  duration?: number
  reason: string
} {
  const id = String(assetId ?? '').trim()
  if (!id) {
    return {
      found: false,
      asset: null,
      src: '',
      poster: '',
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
      reason: 'asset_projection_missing',
    }
  }

  const src = String(asset.publicPath ?? '').trim()
  if (!src) {
    return {
      found: false,
      asset,
      src: '',
      poster: String(asset.presentation?.posterPublicPath ?? '').trim(),
      reason: 'asset_public_path_missing',
    }
  }

  return {
    found: true,
    asset,
    src,
    poster: String(asset.presentation?.posterPublicPath ?? '').trim(),
    manifestWidth: positiveFinite(asset.media?.width),
    manifestHeight: positiveFinite(asset.media?.height),
    duration: durationSecondsFromDecimalMilliseconds(asset.media?.durationMs),
    reason: '',
  }
}

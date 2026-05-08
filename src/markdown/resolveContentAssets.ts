import type { MediaAssetResult } from './mediaAssetTypes'
import { recordMediaAssetWarning } from './mediaAssetWarnings'
import {
  resolveContentAssetFromDir,
  type AssetResolution,
} from '@/content/assetRegistry'

function toMediaAssetResult(contentDir: string, resolution: AssetResolution): MediaAssetResult {
  return {
    input: resolution.source,
    url: resolution.url,
    kind: resolution.kind,
    found: resolution.found,
    reason: resolution.reason,
    contentDir,
    resolvedKey: resolution.relativePath,
  }
}

export function resolveContentAssetMeta(
  contentDir: string,
  src: string | undefined,
): MediaAssetResult {
  const resolution = resolveContentAssetFromDir(contentDir, src)
  const result = toMediaAssetResult(contentDir, resolution)

  if (!result.found || resolution.warning) {
    recordMediaAssetWarning(result)
  }

  return result
}

export function resolveContentAsset(contentDir: string, src: string | undefined): string {
  return resolveContentAssetMeta(contentDir, src).url
}

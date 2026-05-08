import type { MediaAssetResult } from './mediaAssetTypes'

const warnings: MediaAssetResult[] = []

export function recordMediaAssetWarning(result: MediaAssetResult): void {
  if (result.found) return

  warnings.push(result)

  if (import.meta.env.DEV) {
    console.warn('[VARUNTOOLS][media-asset]', {
      input: result.input,
      contentDir: result.contentDir,
      reason: result.reason,
      resolvedKey: result.resolvedKey,
    })
  }
}

export function getMediaAssetWarnings(): MediaAssetResult[] {
  return [...warnings]
}

export function clearMediaAssetWarnings(): void {
  warnings.length = 0
}

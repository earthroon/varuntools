import type { EwaAdaptiveTileParams, EwaTileDiagnostics } from './ewaTypes'
import type { EwaSourceTexture } from './ewaTextureUpload'

export type EwaTileMaskEstimateInput = {
  source: Pick<EwaSourceTexture, 'width' | 'height'>
  targetWidth: number
  targetHeight: number
  adaptive: EwaAdaptiveTileParams
  qmapSource?: 'generated-from-source' | 'provided-qmap'
  qLodMaxMix?: number
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function estimateEwaTileDiagnostics(input: EwaTileMaskEstimateInput): EwaTileDiagnostics {
  const tilePx = Math.max(8, Math.round(input.adaptive.tilePx || 32))
  const tilesW = Math.max(1, Math.ceil(Math.max(1, input.source.width) / tilePx))
  const tilesH = Math.max(1, Math.ceil(Math.max(1, input.source.height) / tilePx))
  const totalTiles = tilesW * tilesH
  const scaleX = input.source.width / Math.max(1, input.targetWidth)
  const scaleY = input.source.height / Math.max(1, input.targetHeight)
  const scalePressure = clamp01((Math.max(scaleX, scaleY) - 1) / 4)
  const thresholdPressure = clamp01(1 - input.adaptive.qThresh)
  const activeTileRatio = clamp01(0.08 + scalePressure * 0.22 + thresholdPressure * 0.18)
  const activeTileCount = Math.min(totalTiles, Math.max(0, Math.round(totalTiles * activeTileRatio)))
  const level2Count = Math.min(activeTileCount, Math.max(0, Math.round(activeTileCount * (0.25 + thresholdPressure * 0.25))))
  const level1Count = Math.max(0, activeTileCount - level2Count)
  const level0Count = Math.max(0, totalTiles - activeTileCount)
  return {
    tilePx,
    tilesW,
    tilesH,
    totalTiles,
    level0Count,
    level1Count,
    level2Count,
    activeTileCount,
    activeTileRatio: Math.round(activeTileRatio * 1000) / 1000,
    qThresh: input.adaptive.qThresh,
    qmapSource: input.qmapSource || 'generated-from-source',
    qLodMaxMix: input.qLodMaxMix ?? 0.7,
  }
}

export function isEwaTileMaskDense(diagnostics: EwaTileDiagnostics): boolean {
  return diagnostics.activeTileRatio > 0.75
}

export function isEwaTileMaskEmpty(diagnostics: EwaTileDiagnostics): boolean {
  return diagnostics.activeTileCount <= 0
}

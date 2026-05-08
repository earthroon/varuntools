import { EWA_GALLERY_PRESETS, resolveEwaComputeMode } from './ewaPresets'
import type { EwaAdaptiveTileParams, EwaGalleryPresetId, EwaPresetConfig } from './ewaTypes'

export function getAdaptiveTileParamsForPreset(preset: EwaPresetConfig): EwaAdaptiveTileParams {
  return preset.adaptive
}

export function shouldUseAdaptiveTileMode(preset: EwaPresetConfig): boolean {
  return resolveEwaComputeMode(preset) === 'adaptive-tile' && !!preset.adaptive?.enabled && preset.allowWebGpu && !preset.preferFallback
}

export function getAdaptiveTilePreset(id: EwaGalleryPresetId): EwaPresetConfig {
  return EWA_GALLERY_PRESETS[id] || EWA_GALLERY_PRESETS.auto
}

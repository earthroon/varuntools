import { getEwaComputeMode, isEwaDebugEnabled } from './ewaDebug'
import type { EwaAdaptiveTileParams, EwaComputeMode, EwaGalleryPresetId, EwaImageAuthoringMetadata, EwaPresetConfig, ResolvedEwaAuthoringMetadata } from './ewaTypes'


const EWA_METADATA_VALID_PRESETS = new Set<EwaGalleryPresetId>(['auto', 'photo', 'ui-low-ring', 'line-art', 'pixel-safe'])
const EWA_METADATA_VALID_MODES = new Set<EwaComputeMode>(['basic', 'adaptive-tile'])

function toOptionalString(value: unknown): string | undefined {
  const text = String(value ?? '').trim()
  return text || undefined
}

function toOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  const text = String(value ?? '').trim().toLowerCase()
  if (text === 'true') return true
  if (text === 'false') return false
  return undefined
}

export function normalizeEwaAuthoringMetadata(input: EwaImageAuthoringMetadata | Record<string, unknown> | null | undefined): ResolvedEwaAuthoringMetadata {
  const warnings: string[] = []
  const ewaPreset = toOptionalString(input?.ewaPreset)
  const ewaMode = toOptionalString(input?.ewaMode)
  const pixelSafe = toOptionalBoolean(input?.pixelSafe)
  const ewaEnabled = toOptionalBoolean(input?.ewaEnabled)
  const ewaNote = toOptionalString(input?.ewaNote)

  if (ewaPreset && !EWA_METADATA_VALID_PRESETS.has(ewaPreset as EwaGalleryPresetId)) warnings.push('EWA_METADATA_INVALID_PRESET')
  if (ewaMode && !EWA_METADATA_VALID_MODES.has(ewaMode as EwaComputeMode)) warnings.push('EWA_METADATA_INVALID_MODE')
  if (pixelSafe === true && ewaPreset && ewaPreset !== 'pixel-safe') warnings.push('EWA_METADATA_PIXEL_SAFE_OVERRIDES_PRESET')
  if (ewaEnabled === false && (ewaPreset || ewaMode || pixelSafe === true)) warnings.push('EWA_METADATA_DISABLED_OVERRIDES_PRESET')

  return {
    ewaPreset,
    ewaMode,
    pixelSafe,
    ewaEnabled,
    ewaNote,
    source: ewaPreset || ewaMode || pixelSafe !== undefined || ewaEnabled !== undefined || ewaNote ? 'metadata' : 'auto',
    warnings,
  }
}

export function resolveEwaPresetFromAuthoring(input: {
  metadata?: EwaImageAuthoringMetadata | Record<string, unknown> | null
  src?: string
  role?: string
  kind?: string
  alt?: string
  caption?: string
  title?: string
} = {}): { preset: EwaPresetConfig; authoring: ResolvedEwaAuthoringMetadata } {
  const authoring = normalizeEwaAuthoringMetadata(input.metadata)
  if (authoring.ewaEnabled === false) return { preset: EWA_GALLERY_PRESETS.auto, authoring }
  if (authoring.pixelSafe === true) return { preset: EWA_GALLERY_PRESETS['pixel-safe'], authoring }
  if (authoring.ewaPreset && EWA_METADATA_VALID_PRESETS.has(authoring.ewaPreset as EwaGalleryPresetId)) {
    return { preset: EWA_GALLERY_PRESETS[authoring.ewaPreset as EwaGalleryPresetId], authoring }
  }
  return { preset: inferEwaGalleryPreset(input), authoring }
}

export const EWA_GALLERY_ALGORITHM_VERSION = 'ewa-gallery-v2-adaptive-tile'

const disabledAdaptive: EwaAdaptiveTileParams = {
  enabled: false,
  tilePx: 32,
  qThresh: 0.38,
  fastMode: 'box',
  radiusMul: 1.2,
  sigma: 0.72,
  deThresh: 0.06,
  deSoft: 0.28,
  deK: 0.85,
}

export const EWA_GALLERY_PRESETS: Record<EwaGalleryPresetId, EwaPresetConfig> = {
  auto: {
    id: 'auto',
    label: 'Auto low-ring EWA',
    description: 'Balanced default for gallery images that need low-ring downscale without changing the source asset.',
    allowWebGpu: true,
    computeMode: 'basic',
    params: {
      radiusMul: 1.25,
      sigma: 0.68,
      anisoAngle: 0,
      anisoAspect: 1,
      deThresh: 0.06,
      deSoft: 0.28,
      deK: 0.85,
    },
    adaptive: { ...disabledAdaptive, enabled: false, tilePx: 32, qThresh: 0.38, fastMode: 'box' },
  },
  photo: {
    id: 'photo',
    label: 'Photo EWA',
    description: 'Softer photographic downscale that preserves overall texture without harsh edge ghosts.',
    allowWebGpu: true,
    computeMode: 'basic',
    params: {
      radiusMul: 1.35,
      sigma: 0.62,
      anisoAngle: 0,
      anisoAspect: 1,
      deThresh: 0.04,
      deSoft: 0.25,
      deK: 0.75,
    },
    adaptive: { ...disabledAdaptive, enabled: false, tilePx: 48, qThresh: 0.45, fastMode: 'box', sigma: 0.68, radiusMul: 1.25 },
  },
  'ui-low-ring': {
    id: 'ui-low-ring',
    label: 'UI low-ring EWA',
    description: 'Conservative low-ring preset for UI screenshots, small text, and high-contrast interface edges.',
    allowWebGpu: true,
    computeMode: 'adaptive-tile',
    params: {
      radiusMul: 1.12,
      sigma: 0.78,
      anisoAngle: 0,
      anisoAspect: 1,
      deThresh: 0.08,
      deSoft: 0.34,
      deK: 0.95,
    },
    adaptive: {
      enabled: true,
      tilePx: 32,
      qThresh: 0.35,
      fastMode: 'box',
      radiusMul: 1.2,
      sigma: 0.72,
      deThresh: 0.08,
      deSoft: 0.34,
      deK: 0.95,
    },
  },
  'line-art': {
    id: 'line-art',
    label: 'Line-art low-ghost EWA',
    description: 'Low-ghost edge-safe preset for icons, diagrams, and line-heavy assets.',
    allowWebGpu: true,
    computeMode: 'adaptive-tile',
    params: {
      radiusMul: 1.05,
      sigma: 0.85,
      anisoAngle: 0,
      anisoAspect: 1,
      deThresh: 0.05,
      deSoft: 0.38,
      deK: 1.0,
    },
    adaptive: {
      enabled: true,
      tilePx: 24,
      qThresh: 0.30,
      fastMode: 'box',
      radiusMul: 1.10,
      sigma: 0.82,
      deThresh: 0.05,
      deSoft: 0.38,
      deK: 1.0,
    },
  },
  'pixel-safe': {
    id: 'pixel-safe',
    label: 'Pixel-safe fallback',
    description: 'Disables WebGPU EWA for pixel/dot assets where smoothing pollution is riskier than ringing.',
    allowWebGpu: false,
    preferFallback: true,
    computeMode: 'basic',
    params: {
      radiusMul: 1,
      sigma: 0,
      anisoAngle: 0,
      anisoAspect: 1,
      deThresh: 0,
      deSoft: 0,
      deK: 0,
    },
    adaptive: {
      enabled: false,
      tilePx: 32,
      qThresh: 1,
      fastMode: 'box',
      radiusMul: 1,
      sigma: 0,
      deThresh: 0,
      deSoft: 0,
      deK: 0,
    },
  },
}

export type { EwaGalleryPresetId, EwaPresetConfig as EwaGalleryPreset }

export function resolveEwaGalleryPreset(input?: string | null): EwaPresetConfig {
  const id = String(input || 'auto').trim() as EwaGalleryPresetId
  return EWA_GALLERY_PRESETS[id] || EWA_GALLERY_PRESETS.auto
}

export function inferEwaGalleryPreset(meta: {
  explicitPreset?: string | null
  src?: string
  role?: string
  kind?: string
  alt?: string
  caption?: string
  title?: string
} = {}): EwaPresetConfig {
  if (meta.explicitPreset) return resolveEwaGalleryPreset(meta.explicitPreset)

  const text = [meta.src, meta.role, meta.kind, meta.alt, meta.caption, meta.title]
    .filter(Boolean)
    .join(' ')
    .normalize('NFKC')
    .toLowerCase()

  if (/pixel|dot|sprite|nearest|8bit|8-bit|도트|픽셀/.test(text)) return EWA_GALLERY_PRESETS['pixel-safe']
  if (/ui|screen|screenshot|interface|figma|wireframe|dashboard|admin|mockup|스크린샷|화면/.test(text)) return EWA_GALLERY_PRESETS['ui-low-ring']
  if (/line|icon|logo|svg|diagram|vector|라인|아이콘|로고|도식/.test(text)) return EWA_GALLERY_PRESETS['line-art']
  if (/photo|image|visual|gallery|사진|이미지|비주얼/.test(text)) return EWA_GALLERY_PRESETS.photo
  return EWA_GALLERY_PRESETS.auto
}

export function resolveEwaComputeMode(preset: EwaPresetConfig, explicitMode?: string | null): EwaComputeMode {
  if (explicitMode === 'basic' || explicitMode === 'adaptive-tile') return explicitMode
  const mode = getEwaComputeMode()
  if (isEwaDebugEnabled() && (mode === 'basic' || mode === 'adaptive-tile')) return mode
  if (preset.preferFallback || !preset.allowWebGpu) return 'basic'
  if (preset.computeMode === 'adaptive-tile' && preset.adaptive?.enabled) return 'adaptive-tile'
  return 'basic'
}

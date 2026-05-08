export type EwaGalleryPresetId = 'auto' | 'photo' | 'ui-low-ring' | 'line-art' | 'pixel-safe'

export type EwaComputeMode = 'basic' | 'adaptive-tile'

export type EwaRolloutMode = 'off' | 'debug-only' | 'metadata-only' | 'enabled'
export type EwaRolloutSource = 'env' | 'debug-override' | 'default'
export type EwaRolloutDecisionReason =
  | 'rollout-enabled'
  | 'rollout-off'
  | 'debug-only-without-debug'
  | 'metadata-required'
  | 'metadata-enabled'
  | 'metadata-disabled'
  | 'pixel-safe'
  | 'runtime-health-blocked'
  | 'webgpu-unsupported'

export type EwaGalleryStatus =
  | 'idle'
  | 'unsupported'
  | 'initializing'
  | 'loading-source'
  | 'processing'
  | 'ready'
  | 'fallback'
  | 'timeout'
  | 'error'

export type EwaFallbackReason =
  | 'missing-source'
  | 'webgpu-unsupported'
  | 'adapter-unavailable'
  | 'device-request-failed'
  | 'device-lost'
  | 'source-decode-failed'
  | 'pixel-safe-preset'
  | 'processing-timeout'
  | 'processor-error'
  | 'stale-result'
  | 'upscale-skipped'
  | 'adaptive-tile-failed'
  | 'presentation-blob-failed'
  | 'presentation-canvas-failed'
  | 'presentation-format-unsupported'
  | 'presentation-color-policy-failed'
  | 'ewa-disabled-by-metadata'
  | 'invalid-authoring-metadata'
  | 'quality-budget-original'
  | 'runtime-health-cooldown'
  | 'runtime-health-disabled'
  | 'rollout-off'
  | 'rollout-debug-only-blocked'
  | 'rollout-metadata-required'
  | 'rollout-webgpu-unsupported'


export type EwaAuthoringMetadataSource = 'metadata' | 'auto' | 'debug-override'

export type EwaImageAuthoringMetadata = {
  ewaPreset?: string
  ewaMode?: string
  pixelSafe?: boolean
  ewaEnabled?: boolean
  ewaNote?: string
}

export type ResolvedEwaAuthoringMetadata = EwaImageAuthoringMetadata & {
  source: EwaAuthoringMetadataSource
  warnings: string[]
}

export type EwaPresetParams = {
  radiusMul: number
  sigma: number
  anisoAngle: number
  anisoAspect: number
  deThresh: number
  deSoft: number
  deK: number
}

export type EwaAdaptiveTileParams = {
  enabled: boolean
  tilePx: number
  qThresh: number
  fastMode: 'box' | 'bilinear'
  radiusMul: number
  sigma: number
  deThresh: number
  deSoft: number
  deK: number
}

export type EwaTileDiagnostics = {
  tilePx: number
  tilesW: number
  tilesH: number
  totalTiles: number
  activeTileCount: number
  activeTileRatio: number
  qThresh: number
}

export type EwaPresetConfig = {
  id: EwaGalleryPresetId
  label: string
  description: string
  allowWebGpu: boolean
  preferFallback?: boolean
  computeMode?: EwaComputeMode
  params: EwaPresetParams
  adaptive: EwaAdaptiveTileParams
}

export type EwaProcessToken = {
  id: symbol
  src: string
  targetWidth: number
  targetHeight: number
  preset: EwaGalleryPresetId
  computeMode: EwaComputeMode
  startedAt: number
}


export type EwaPresentationColorSpace = 'srgb'
export type EwaPresentationBitDepth = 8
export type EwaPresentationDynamicRange = 'sdr'
export type EwaPresentationFormat = 'webp' | 'png'
export type EwaPresentationFamily = 'rgba8unorm-srgb'
export type EwaComputeTextureFormat = 'rgba16float'

export type EwaPresentationPolicy = {
  computeFormat: EwaComputeTextureFormat
  presentationFamily: EwaPresentationFamily
  canvasFormat: GPUTextureFormat | string
  colorSpace: EwaPresentationColorSpace
  bitDepth: EwaPresentationBitDepth
  dynamicRange: EwaPresentationDynamicRange
  alphaMode: 'opaque' | 'premultiplied'
  outputFormat: EwaPresentationFormat
  outputQuality: number
}

export const DEFAULT_EWA_PRESENTATION_POLICY: EwaPresentationPolicy = {
  computeFormat: 'rgba16float',
  presentationFamily: 'rgba8unorm-srgb',
  canvasFormat: 'bgra8unorm',
  colorSpace: 'srgb',
  bitDepth: 8,
  dynamicRange: 'sdr',
  alphaMode: 'opaque',
  outputFormat: 'webp',
  outputQuality: 0.92,
}

export function createEwaPresentationPolicy(canvasFormat?: GPUTextureFormat | string): EwaPresentationPolicy {
  return {
    ...DEFAULT_EWA_PRESENTATION_POLICY,
    // Policy family is fixed to rgba8unorm-sRGB, while the concrete WebGPU canvas format may be
    // rgba8unorm or bgra8unorm from navigator.gpu.getPreferredCanvasFormat().
    canvasFormat: canvasFormat || DEFAULT_EWA_PRESENTATION_POLICY.canvasFormat,
  }
}

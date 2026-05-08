import type { EwaComputeMode, EwaFallbackReason, EwaGalleryPresetId, EwaGalleryStatus, EwaTileDiagnostics, EwaPresentationBitDepth, EwaPresentationColorSpace, EwaPresentationDynamicRange, EwaPresentationFamily, EwaPresentationFormat, ResolvedEwaAuthoringMetadata } from './ewaTypes'
import type { EwaRolloutDiagnostics } from './ewaRolloutGate'
import type { EwaQualityBudgetDiagnostics } from './ewaQualityBudget'
import type { EwaRuntimeHealthDiagnostics } from './ewaRuntimeHealth'

export type EwaDeviceDiagnostics = {
  supported: boolean
  adapterName?: string
  features: string[]
  limits: Record<string, number>
  preferredCanvasFormat?: string
  failureReason?: string
}

export type EwaOutputMode = 'original' | 'ewa-canvas' | 'ewa-object-url' | 'fallback'

export type EwaPresentationDiagnostics = {
  computeFormat?: 'rgba16float'
  presentationFamily?: EwaPresentationFamily
  canvasFormat?: string
  colorSpace?: EwaPresentationColorSpace
  bitDepth?: EwaPresentationBitDepth
  dynamicRange?: EwaPresentationDynamicRange
  alphaMode?: 'opaque' | 'premultiplied'
  outputFormat?: EwaPresentationFormat
  outputQuality?: number
  blobBytes?: number
  blobMs?: number
  objectUrlCreated?: boolean
  warnings?: string[]
}

export type EwaProcessDiagnostics = {
  sourceWidth?: number
  sourceHeight?: number
  targetWidth?: number
  targetHeight?: number
  devicePixelRatio?: number
  preset: EwaGalleryPresetId
  status: EwaGalleryStatus
  fallbackReason?: EwaFallbackReason | string
  decodeMs?: number
  uploadMs?: number
  computeMs?: number
  presentMs?: number
  totalMs?: number
  cacheHit?: boolean
  outputMode?: EwaOutputMode
  computeMode?: EwaComputeMode
  adaptiveFallback?: 'none' | 'basic' | 'original'
  tileDiagnostics?: EwaTileDiagnostics
  presentation?: EwaPresentationDiagnostics
  authoring?: ResolvedEwaAuthoringMetadata
  qualityBudget?: EwaQualityBudgetDiagnostics
  runtimeHealth?: EwaRuntimeHealthDiagnostics
  rollout?: EwaRolloutDiagnostics
  warnings: string[]
}

export const EWA_DIAG_WARNINGS = {
  WEBGPU_UNSUPPORTED: 'EWA_DIAG_WEBGPU_UNSUPPORTED',
  DEVICE_LOST: 'EWA_DIAG_DEVICE_LOST',
  TARGET_TOO_LARGE: 'EWA_DIAG_TARGET_TOO_LARGE',
  DPR_CLAMPED: 'EWA_DIAG_DPR_CLAMPED',
  SLOW_DECODE: 'EWA_DIAG_SLOW_DECODE',
  SLOW_UPLOAD: 'EWA_DIAG_SLOW_UPLOAD',
  SLOW_COMPUTE: 'EWA_DIAG_SLOW_COMPUTE',
  SLOW_PRESENT: 'EWA_DIAG_SLOW_PRESENT',
  CACHE_HIT: 'EWA_DIAG_CACHE_HIT',
  PIXEL_SAFE_BYPASS: 'EWA_DIAG_PIXEL_SAFE_BYPASS',
  FALLBACK_USED: 'EWA_DIAG_FALLBACK_USED',
  ADAPTIVE_TILE_ENABLED: 'EWA_DIAG_ADAPTIVE_TILE_ENABLED',
  ADAPTIVE_TILE_FALLBACK_BASIC: 'EWA_DIAG_ADAPTIVE_TILE_FALLBACK_BASIC',
  ADAPTIVE_TILE_FALLBACK_ORIGINAL: 'EWA_DIAG_ADAPTIVE_TILE_FALLBACK_ORIGINAL',
  TILE_MASK_EMPTY: 'EWA_DIAG_TILE_MASK_EMPTY',
  TILE_MASK_DENSE: 'EWA_DIAG_TILE_MASK_DENSE',
  ADAPTIVE_COMPUTE_SLOW: 'EWA_DIAG_ADAPTIVE_COMPUTE_SLOW',
  PRESENTATION_POLICY_SRGB8: 'EWA_DIAG_PRESENTATION_POLICY_SRGB8',
  BLOB_FAILED: 'EWA_DIAG_BLOB_FAILED',
  PRESENTATION_CANVAS_FAILED: 'EWA_DIAG_PRESENTATION_CANVAS_FAILED',
  OUTPUT_FORMAT_FALLBACK: 'EWA_DIAG_OUTPUT_FORMAT_FALLBACK',
  ALPHA_MODE_PREMULTIPLIED: 'EWA_DIAG_ALPHA_MODE_PREMULTIPLIED',
  PRESENTATION_SLOW_BLOB: 'EWA_DIAG_PRESENTATION_SLOW_BLOB',
  TRANSPARENT_IMAGE_OUTPUT_PNG_RECOMMENDED: 'EWA_DIAG_TRANSPARENT_IMAGE_OUTPUT_PNG_RECOMMENDED',
  METADATA_INVALID_PRESET: 'EWA_METADATA_INVALID_PRESET',
  METADATA_INVALID_MODE: 'EWA_METADATA_INVALID_MODE',
  METADATA_PIXEL_SAFE_OVERRIDES_PRESET: 'EWA_METADATA_PIXEL_SAFE_OVERRIDES_PRESET',
  METADATA_DISABLED_OVERRIDES_PRESET: 'EWA_METADATA_DISABLED_OVERRIDES_PRESET',
  DEVICE_TIER_LOW: 'EWA_DIAG_DEVICE_TIER_LOW',
  DEVICE_TIER_UNSUPPORTED: 'EWA_DIAG_DEVICE_TIER_UNSUPPORTED',
  TARGET_CLAMPED_BY_BUDGET: 'EWA_DIAG_TARGET_CLAMPED_BY_BUDGET',
  DPR_CLAMPED_BY_BUDGET: 'EWA_DIAG_DPR_CLAMPED_BY_BUDGET',
  ADAPTIVE_DISABLED_BY_BUDGET: 'EWA_DIAG_ADAPTIVE_DISABLED_BY_BUDGET',
  BASIC_EWA_DISABLED_BY_BUDGET: 'EWA_DIAG_BASIC_EWA_DISABLED_BY_BUDGET',
  TIMEOUT_BUDGET_REDUCED: 'EWA_DIAG_TIMEOUT_BUDGET_REDUCED',
  TIER_DEBUG_OVERRIDE: 'EWA_DIAG_TIER_DEBUG_OVERRIDE',
  RUNTIME_DEGRADED: 'EWA_DIAG_RUNTIME_DEGRADED',
  RUNTIME_COOLDOWN_ACTIVE: 'EWA_DIAG_RUNTIME_COOLDOWN_ACTIVE',
  RUNTIME_DISABLED: 'EWA_DIAG_RUNTIME_DISABLED',
  RUNTIME_TIER_DOWNGRADED: 'EWA_DIAG_RUNTIME_TIER_DOWNGRADED',
  RUNTIME_REPEATED_TIMEOUT: 'EWA_DIAG_RUNTIME_REPEATED_TIMEOUT',
  RUNTIME_DEVICE_LOST: 'EWA_DIAG_RUNTIME_DEVICE_LOST',
  RUNTIME_REPEATED_FALLBACK: 'EWA_DIAG_RUNTIME_REPEATED_FALLBACK',
  ROLLOUT_OFF: 'EWA_DIAG_ROLLOUT_OFF',
  ROLLOUT_DEBUG_ONLY_BLOCKED: 'EWA_DIAG_ROLLOUT_DEBUG_ONLY_BLOCKED',
  ROLLOUT_METADATA_REQUIRED: 'EWA_DIAG_ROLLOUT_METADATA_REQUIRED',
  ROLLOUT_ALLOWED_BY_METADATA: 'EWA_DIAG_ROLLOUT_ALLOWED_BY_METADATA',
  ROLLOUT_ALLOWED_BY_DEBUG_OVERRIDE: 'EWA_DIAG_ROLLOUT_ALLOWED_BY_DEBUG_OVERRIDE',
  ROLLOUT_WEBGPU_UNSUPPORTED: 'EWA_DIAG_ROLLOUT_WEBGPU_UNSUPPORTED',
} as const

export function nowForEwaDiagnostics(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now()
  return Date.now()
}

export function roundEwaMs(value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined
  return Math.max(0, Math.round((value || 0) * 10) / 10)
}

export function createEmptyEwaDiagnostics(input: {
  preset: EwaGalleryPresetId
  status?: EwaGalleryStatus
  sourceWidth?: number
  sourceHeight?: number
  targetWidth?: number
  targetHeight?: number
  devicePixelRatio?: number
  fallbackReason?: EwaFallbackReason | string
  outputMode?: EwaOutputMode
  computeMode?: EwaComputeMode
  adaptiveFallback?: 'none' | 'basic' | 'original'
  tileDiagnostics?: EwaTileDiagnostics
  presentation?: EwaPresentationDiagnostics
  authoring?: ResolvedEwaAuthoringMetadata
  qualityBudget?: EwaQualityBudgetDiagnostics
  runtimeHealth?: EwaRuntimeHealthDiagnostics
  rollout?: EwaRolloutDiagnostics
}): EwaProcessDiagnostics {
  return {
    preset: input.preset,
    status: input.status || 'idle',
    sourceWidth: input.sourceWidth,
    sourceHeight: input.sourceHeight,
    targetWidth: input.targetWidth,
    targetHeight: input.targetHeight,
    devicePixelRatio: input.devicePixelRatio,
    fallbackReason: input.fallbackReason,
    outputMode: input.outputMode || 'original',
    computeMode: input.computeMode,
    adaptiveFallback: input.adaptiveFallback,
    tileDiagnostics: input.tileDiagnostics,
    presentation: input.presentation,
    authoring: input.authoring,
    qualityBudget: input.qualityBudget,
    runtimeHealth: input.runtimeHealth,
    rollout: input.rollout,
    warnings: input.authoring?.warnings ? [...input.authoring.warnings] : [],
  }
}

export function addTimingWarnings(diagnostics: EwaProcessDiagnostics): EwaProcessDiagnostics {
  const warnings = new Set(diagnostics.warnings)
  if ((diagnostics.decodeMs || 0) > 400) warnings.add(EWA_DIAG_WARNINGS.SLOW_DECODE)
  if ((diagnostics.uploadMs || 0) > 250) warnings.add(EWA_DIAG_WARNINGS.SLOW_UPLOAD)
  if ((diagnostics.computeMs || 0) > 600) warnings.add(EWA_DIAG_WARNINGS.SLOW_COMPUTE)
  if (diagnostics.computeMode === 'adaptive-tile') warnings.add(EWA_DIAG_WARNINGS.ADAPTIVE_TILE_ENABLED)
  if ((diagnostics.computeMs || 0) > 800 && diagnostics.computeMode === 'adaptive-tile') warnings.add(EWA_DIAG_WARNINGS.ADAPTIVE_COMPUTE_SLOW)
  if (diagnostics.adaptiveFallback === 'basic') warnings.add(EWA_DIAG_WARNINGS.ADAPTIVE_TILE_FALLBACK_BASIC)
  if (diagnostics.adaptiveFallback === 'original') warnings.add(EWA_DIAG_WARNINGS.ADAPTIVE_TILE_FALLBACK_ORIGINAL)
  if (diagnostics.tileDiagnostics?.activeTileCount === 0) warnings.add(EWA_DIAG_WARNINGS.TILE_MASK_EMPTY)
  if ((diagnostics.tileDiagnostics?.activeTileRatio || 0) > 0.75) warnings.add(EWA_DIAG_WARNINGS.TILE_MASK_DENSE)
  if ((diagnostics.presentMs || 0) > 300) warnings.add(EWA_DIAG_WARNINGS.SLOW_PRESENT)
  if (diagnostics.presentation?.presentationFamily === 'rgba8unorm-srgb') warnings.add(EWA_DIAG_WARNINGS.PRESENTATION_POLICY_SRGB8)
  if (diagnostics.presentation?.warnings?.includes('EWA_DIAG_BLOB_FAILED')) warnings.add(EWA_DIAG_WARNINGS.BLOB_FAILED)
  if (diagnostics.presentation?.warnings?.includes('EWA_DIAG_OUTPUT_FORMAT_FALLBACK')) warnings.add(EWA_DIAG_WARNINGS.OUTPUT_FORMAT_FALLBACK)
  if (diagnostics.presentation?.alphaMode === 'premultiplied') warnings.add(EWA_DIAG_WARNINGS.ALPHA_MODE_PREMULTIPLIED)
  if ((diagnostics.presentation?.blobMs || 0) > 300) warnings.add(EWA_DIAG_WARNINGS.PRESENTATION_SLOW_BLOB)
  for (const warning of diagnostics.authoring?.warnings || []) warnings.add(warning)
  if (diagnostics.qualityBudget?.tier === 'low') warnings.add(EWA_DIAG_WARNINGS.DEVICE_TIER_LOW)
  if (diagnostics.qualityBudget?.tier === 'unsupported') warnings.add(EWA_DIAG_WARNINGS.DEVICE_TIER_UNSUPPORTED)
  if (diagnostics.qualityBudget?.targetClamped) warnings.add(EWA_DIAG_WARNINGS.TARGET_CLAMPED_BY_BUDGET)
  if (diagnostics.qualityBudget && (diagnostics.devicePixelRatio || 1) > diagnostics.qualityBudget.maxDevicePixelRatio) warnings.add(EWA_DIAG_WARNINGS.DPR_CLAMPED_BY_BUDGET)
  if (diagnostics.qualityBudget?.requestedMode === 'adaptive-tile' && diagnostics.qualityBudget?.resolvedMode === 'basic') warnings.add(EWA_DIAG_WARNINGS.ADAPTIVE_DISABLED_BY_BUDGET)
  if (diagnostics.qualityBudget?.resolvedMode === 'original' && diagnostics.qualityBudget?.allowBasicEwa === false) warnings.add(EWA_DIAG_WARNINGS.BASIC_EWA_DISABLED_BY_BUDGET)
  if ((diagnostics.qualityBudget?.timeoutMs || 3500) < 3500) warnings.add(EWA_DIAG_WARNINGS.TIMEOUT_BUDGET_REDUCED)
  if (diagnostics.qualityBudget?.tierReason?.includes('debug-override')) warnings.add(EWA_DIAG_WARNINGS.TIER_DEBUG_OVERRIDE)
  if (diagnostics.runtimeHealth?.state === 'degraded') warnings.add(EWA_DIAG_WARNINGS.RUNTIME_DEGRADED)
  if (diagnostics.runtimeHealth?.cooldownActive) warnings.add(EWA_DIAG_WARNINGS.RUNTIME_COOLDOWN_ACTIVE)
  if (diagnostics.runtimeHealth?.state === 'disabled') warnings.add(EWA_DIAG_WARNINGS.RUNTIME_DISABLED)
  if (diagnostics.runtimeHealth?.recommendedTier && diagnostics.qualityBudget?.tier && diagnostics.runtimeHealth.recommendedTier !== diagnostics.qualityBudget.tier) warnings.add(EWA_DIAG_WARNINGS.RUNTIME_TIER_DOWNGRADED)
  if (diagnostics.runtimeHealth?.reasons?.includes('repeated-timeout')) warnings.add(EWA_DIAG_WARNINGS.RUNTIME_REPEATED_TIMEOUT)
  if (diagnostics.runtimeHealth?.reasons?.includes('device-lost')) warnings.add(EWA_DIAG_WARNINGS.RUNTIME_DEVICE_LOST)
  if (diagnostics.runtimeHealth?.reasons?.includes('repeated-fallback')) warnings.add(EWA_DIAG_WARNINGS.RUNTIME_REPEATED_FALLBACK)
  if (diagnostics.rollout?.reason === 'rollout-off') warnings.add(EWA_DIAG_WARNINGS.ROLLOUT_OFF)
  if (diagnostics.rollout?.reason === 'debug-only-without-debug') warnings.add(EWA_DIAG_WARNINGS.ROLLOUT_DEBUG_ONLY_BLOCKED)
  if (diagnostics.rollout?.reason === 'metadata-required') warnings.add(EWA_DIAG_WARNINGS.ROLLOUT_METADATA_REQUIRED)
  if (diagnostics.rollout?.reason === 'metadata-enabled') warnings.add(EWA_DIAG_WARNINGS.ROLLOUT_ALLOWED_BY_METADATA)
  if (diagnostics.rollout?.source === 'debug-override' && diagnostics.rollout.allowed) warnings.add(EWA_DIAG_WARNINGS.ROLLOUT_ALLOWED_BY_DEBUG_OVERRIDE)
  if (diagnostics.rollout?.reason === 'webgpu-unsupported') warnings.add(EWA_DIAG_WARNINGS.ROLLOUT_WEBGPU_UNSUPPORTED)
  if ((diagnostics.totalMs || 0) > 1500) warnings.add('EWA_TOTAL_TIMEOUT_RISK')
  if ((diagnostics.targetWidth || 0) > 1920 || (diagnostics.targetHeight || 0) > 1920) {
    warnings.add(EWA_DIAG_WARNINGS.TARGET_TOO_LARGE)
  }
  return { ...diagnostics, warnings: [...warnings] }
}

export function createFallbackEwaDiagnostics(input: {
  preset: EwaGalleryPresetId
  reason: EwaFallbackReason | string
  sourceWidth?: number
  sourceHeight?: number
  targetWidth?: number
  targetHeight?: number
  devicePixelRatio?: number
  totalMs?: number
  computeMode?: EwaComputeMode
  adaptiveFallback?: 'none' | 'basic' | 'original'
  tileDiagnostics?: EwaTileDiagnostics
  presentation?: EwaPresentationDiagnostics
  authoring?: ResolvedEwaAuthoringMetadata
  qualityBudget?: EwaQualityBudgetDiagnostics
  runtimeHealth?: EwaRuntimeHealthDiagnostics
  rollout?: EwaRolloutDiagnostics
}): EwaProcessDiagnostics {
  const warnings = new Set<string>([EWA_DIAG_WARNINGS.FALLBACK_USED])
  if (input.reason === 'webgpu-unsupported') warnings.add(EWA_DIAG_WARNINGS.WEBGPU_UNSUPPORTED)
  if (input.reason === 'device-lost') warnings.add(EWA_DIAG_WARNINGS.DEVICE_LOST)
  if (input.reason === 'pixel-safe-preset') warnings.add(EWA_DIAG_WARNINGS.PIXEL_SAFE_BYPASS)
  return addTimingWarnings({
    preset: input.preset,
    status: input.reason === 'processing-timeout' ? 'timeout' : 'fallback',
    fallbackReason: input.reason,
    sourceWidth: input.sourceWidth,
    sourceHeight: input.sourceHeight,
    targetWidth: input.targetWidth,
    targetHeight: input.targetHeight,
    devicePixelRatio: input.devicePixelRatio,
    totalMs: roundEwaMs(input.totalMs),
    outputMode: 'fallback',
    computeMode: input.computeMode,
    adaptiveFallback: input.adaptiveFallback,
    tileDiagnostics: input.tileDiagnostics,
    presentation: input.presentation,
    authoring: input.authoring,
    qualityBudget: input.qualityBudget,
    runtimeHealth: input.runtimeHealth,
    rollout: input.rollout,
    warnings: [...new Set([...warnings, ...(input.authoring?.warnings || [])])],
  })
}

export function summarizeEwaDiagnostics(diagnostics: EwaProcessDiagnostics | null | undefined): string {
  if (!diagnostics) return 'No EWA diagnostics yet.'
  const total = diagnostics.totalMs != null ? `${diagnostics.totalMs}ms` : 'n/a'
  const size = diagnostics.targetWidth && diagnostics.targetHeight ? `${diagnostics.targetWidth}x${diagnostics.targetHeight}` : 'unknown target'
  return `${diagnostics.status} · ${diagnostics.preset} · ${size} · ${total}`
}

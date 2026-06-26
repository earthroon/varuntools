import { EwaPresentationError, presentEwaTextureToCanvas, type EwaCanvasPresentation } from './ewaCanvasPresenter'
import { closeEwaImageBitmap, loadImageBitmapForEwa, uploadImageBitmapToTexture, type EwaSourceTexture } from './ewaTextureUpload'
import { runAdaptiveEwaTileDownscale, type EwaAdaptiveTileComputeOutput } from './ewaAdaptiveTileCompute'
import { runEwaAnisoDownscale, type EwaComputeOutput } from './ewaWebGpuCompute'
import { getEwaWebGpuRuntime, type EwaWebGpuRuntime } from './ewaWebGpuRuntime'
import {
  addTimingWarnings,
  createFallbackEwaDiagnostics,
  nowForEwaDiagnostics,
  roundEwaMs,
  type EwaDeviceDiagnostics,
  type EwaProcessDiagnostics,
} from './ewaDiagnostics'
import {
  EWA_GALLERY_ALGORITHM_VERSION,
  resolveEwaComputeMode,
  resolveEwaPresetFromAuthoring,
  type EwaGalleryPreset,
} from './ewaPresets'
import { getEwaTierOverride, resolveEwaDeviceTier } from './ewaDeviceTier'
import { resolveEwaRolloutFeatureMode } from './ewaFeatureFlags'
import { createEwaRolloutDiagnostics, resolveEwaRolloutDecision, type EwaRolloutDiagnostics } from './ewaRolloutGate'
import {
  clampEwaTargetToBudget,
  createEwaQualityBudgetDiagnostics,
  resolveEwaModeWithinBudget,
  resolveEwaQualityBudget,
  type EwaQualityBudget,
  type EwaQualityBudgetDiagnostics,
} from './ewaQualityBudget'
import {
  applyRuntimeHealthToTier,
  createEwaRuntimeHealthDiagnostics,
  getEwaRuntimeHealthSnapshot,
  isEwaRuntimeCooldownActive,
  recordEwaRuntimeHealthResult,
} from './ewaRuntimeHealth'
import type {
  EwaComputeMode,
  EwaFallbackReason,
  EwaGalleryPresetId,
  EwaImageAuthoringMetadata,
  EwaTileDiagnostics,
  ResolvedEwaAuthoringMetadata,
} from './ewaTypes'

export type EwaGalleryProcessRequest = {
  src: string
  sourceWidth?: number
  sourceHeight?: number
  targetWidth: number
  targetHeight: number
  preset?: EwaGalleryPresetId | string
  alt?: string
  caption?: string
  title?: string
  media?: EwaImageAuthoringMetadata
}

export type EwaGalleryProcessResult = {
  ok: boolean
  src: string
  outputUrl?: string
  canvas?: HTMLCanvasElement
  width: number
  height: number
  preset: EwaGalleryPresetId
  algorithmVersion: string
  fallbackReason?: EwaFallbackReason | string
  timedOut?: boolean
  diagnostics: EwaProcessDiagnostics
}

export const EWA_PROCESS_TIMEOUT_MS = 3500

function getEwaDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1
  return Math.min(2, Math.max(1, window.devicePixelRatio || 1))
}

type CacheEntry = EwaGalleryProcessResult & {
  lastUsedAt: number
  destroy?: () => void
}

function makeRuntimeDiagnostics(runtime: EwaWebGpuRuntime): EwaDeviceDiagnostics {
  const limits: Record<string, number> = {}
  const rawLimits = runtime.adapter?.limits
  for (const name of ['maxTextureDimension2D', 'maxComputeInvocationsPerWorkgroup', 'maxComputeWorkgroupSizeX', 'maxComputeWorkgroupSizeY']) {
    const value = Number(rawLimits?.[name])
    if (Number.isFinite(value)) limits[name] = value
  }
  return {
    supported: runtime.state === 'ready',
    features: runtime.adapter?.features ? Array.from(runtime.adapter.features).map(String) : [],
    limits,
    preferredCanvasFormat: runtime.canvasFormat,
    failureReason: runtime.fallbackReason || (runtime.state === 'ready' ? undefined : runtime.state),
  }
}

function makeUnsupportedBudgetDiagnostics(reason: EwaFallbackReason | string): EwaQualityBudgetDiagnostics {
  const budget = resolveEwaQualityBudget('unsupported')
  return createEwaQualityBudgetDiagnostics({
    budget,
    tierReason: reason === 'adapter-unavailable'
      ? ['adapter-unavailable']
      : reason === 'device-request-failed'
        ? ['device-request-failed']
        : ['webgpu-unsupported'],
    requestedMode: 'basic',
    resolvedMode: 'original',
    targetClamped: true,
  })
}

function isNavigatorWebGpuAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

function fallbackReasonForRollout(reason: string): EwaFallbackReason | string {
  if (reason === 'rollout-off') return 'rollout-off'
  if (reason === 'debug-only-without-debug') return 'rollout-debug-only-blocked'
  if (reason === 'metadata-required') return 'rollout-metadata-required'
  if (reason === 'webgpu-unsupported') return 'rollout-webgpu-unsupported'
  if (reason === 'metadata-disabled') return 'ewa-disabled-by-metadata'
  if (reason === 'pixel-safe') return 'pixel-safe-preset'
  if (reason === 'runtime-health-blocked') return 'runtime-health-cooldown'
  return reason
}

export function createEwaGalleryCacheKey(input: EwaGalleryProcessRequest): string {
  const { preset: presetConfig } = resolveEwaPresetFromAuthoring({ ...input, metadata: input.media || (input.preset ? { ewaPreset: input.preset } : undefined) })
  const computeMode = resolveEwaComputeMode(presetConfig, input.media?.ewaMode)
  return [
    input.src,
    Math.round(input.targetWidth),
    Math.round(input.targetHeight),
    presetConfig.id,
    computeMode,
    getEwaTierOverride(),
    EWA_GALLERY_ALGORITHM_VERSION,
  ].join('|')
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs = EWA_PROCESS_TIMEOUT_MS): Promise<T | { timeout: true }> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<{ timeout: true }>((resolve) => {
    timeoutId = setTimeout(() => resolve({ timeout: true }), timeoutMs)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

function shouldSkipUpscale(sourceWidth: number, sourceHeight: number, targetWidth: number, targetHeight: number): boolean {
  return targetWidth >= sourceWidth && targetHeight >= sourceHeight
}

function isAdaptiveOutput(output: EwaComputeOutput | EwaAdaptiveTileComputeOutput): output is EwaAdaptiveTileComputeOutput {
  return Boolean((output as EwaAdaptiveTileComputeOutput).tileDiagnostics)
}

function toEwaFallbackReason(error: unknown): EwaFallbackReason | string {
  if (error instanceof EwaPresentationError) return error.reason
  const message = error instanceof Error ? error.message : String(error || '')
  if (/EWA source texture upload validation failed/.test(message)) return 'source-decode-failed'
  if (/quality-budget-original/.test(message)) return 'quality-budget-original'
  if (/upscale path skipped/.test(message)) return 'upscale-skipped'
  if (/presentation-blob-failed/.test(message)) return 'presentation-blob-failed'
  if (/presentation-canvas-failed|webgpu canvas context/.test(message)) return 'presentation-canvas-failed'
  if (/presentation-color-policy-failed|canvas configure/.test(message)) return 'presentation-color-policy-failed'
  if (/format/.test(message)) return 'presentation-format-unsupported'
  return 'processor-error'
}

export class EwaGalleryProcessor {
  private cache = new Map<string, CacheEntry>()
  private pending = new Map<string, Promise<EwaGalleryProcessResult>>()

  constructor(private maxEntries = 3) {}

  clear(): void {
    for (const entry of this.cache.values()) {
      entry.destroy?.()
      if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl)
    }
    this.cache.clear()
    this.pending.clear()
  }

  async processActiveImage(request: EwaGalleryProcessRequest): Promise<EwaGalleryProcessResult> {
    if (!request.src) return this.fallback(request, 'missing-source')
    const key = createEwaGalleryCacheKey(request)
    const cached = this.cache.get(key)
    if (cached) {
      cached.lastUsedAt = Date.now()
      return {
        ...cached,
        diagnostics: {
          ...cached.diagnostics,
          cacheHit: true,
          warnings: [...new Set([...(cached.diagnostics?.warnings || []), 'EWA_DIAG_CACHE_HIT'])],
        },
      }
    }
    const pending = this.pending.get(key)
    if (pending) return pending
    const job = this.processUncached(request, key).finally(() => this.pending.delete(key))
    this.pending.set(key, job)
    return job
  }

  private async processUncached(request: EwaGalleryProcessRequest, key: string): Promise<EwaGalleryProcessResult> {
    const startedAt = nowForEwaDiagnostics()
    const { preset, authoring } = resolveEwaPresetFromAuthoring({ ...request, metadata: request.media || (request.preset ? { ewaPreset: request.preset } : undefined) })
    if (authoring.ewaEnabled === false) return this.fallback(request, 'ewa-disabled-by-metadata', false, startedAt, preset.id, authoring)
    if (!preset.allowWebGpu || preset.preferFallback) return this.fallback(request, 'pixel-safe-preset', false, startedAt, preset.id, authoring)

    const healthSnapshot = getEwaRuntimeHealthSnapshot()
    const healthDiagnostics = createEwaRuntimeHealthDiagnostics(healthSnapshot)
    const rolloutMode = resolveEwaRolloutFeatureMode()
    const rolloutDecision = resolveEwaRolloutDecision({
      mode: rolloutMode.mode,
      source: rolloutMode.source,
      debugEnabled: rolloutMode.debugEnabled,
      media: authoring,
      runtimeHealthState: healthSnapshot.state,
      webGpuSupported: isNavigatorWebGpuAvailable(),
    })
    const rolloutDiagnostics = createEwaRolloutDiagnostics(rolloutDecision)
    if (!rolloutDecision.allowed) {
      return this.fallback(request, fallbackReasonForRollout(rolloutDecision.reason), false, startedAt, preset.id, authoring, undefined, healthDiagnostics, rolloutDiagnostics)
    }
    if (healthSnapshot.state === 'disabled') {
      return this.fallback(request, 'runtime-health-disabled', false, startedAt, preset.id, authoring, undefined, healthDiagnostics, rolloutDiagnostics)
    }
    if (isEwaRuntimeCooldownActive(healthSnapshot)) {
      return this.fallback(request, 'runtime-health-cooldown', false, startedAt, preset.id, authoring, undefined, healthDiagnostics, rolloutDiagnostics)
    }

    let qualityBudget: EwaQualityBudgetDiagnostics | undefined
    try {
      const runtime = await getEwaWebGpuRuntime()
      if (runtime.state !== 'ready' || !runtime.device) {
        return this.finalizeRuntimeHealth(this.fallback(request, runtime.fallbackReason || runtime.state, false, startedAt, preset.id, authoring, makeUnsupportedBudgetDiagnostics(runtime.fallbackReason || runtime.state)), true)
      }

      const baseTierDecision = resolveEwaDeviceTier({
        diagnostics: makeRuntimeDiagnostics(runtime),
        previousTotalMs: healthSnapshot.recentTotalMs[healthSnapshot.recentTotalMs.length - 1],
        previousTimeoutCount: healthSnapshot.timeouts,
      })
      const healthAdjustedTier = applyRuntimeHealthToTier(baseTierDecision.tier, healthSnapshot)
      const tierReasons = healthAdjustedTier !== baseTierDecision.tier
        ? [...baseTierDecision.reasons, 'slow-previous-processing' as const]
        : baseTierDecision.reasons
      const budget = resolveEwaQualityBudget(healthAdjustedTier)
      this.maxEntries = budget.maxCacheEntries
      const requestedMode = resolveEwaComputeMode(preset, authoring.ewaMode)
      const resolvedMode = resolveEwaModeWithinBudget(requestedMode, budget)
      qualityBudget = createEwaQualityBudgetDiagnostics({
        budget,
        tierReason: tierReasons,
        requestedMode,
        resolvedMode,
        originalTargetWidth: Math.round(request.targetWidth || request.sourceWidth || 1),
        originalTargetHeight: Math.round(request.targetHeight || request.sourceHeight || 1),
      })

      if (resolvedMode === 'original') {
        return this.finalizeRuntimeHealth(this.fallback(request, 'quality-budget-original', false, startedAt, preset.id, authoring, qualityBudget), true)
      }

      const output = await withTimeout(this.renderWithWebGpu(runtime, request, preset, authoring, budget, tierReasons, requestedMode, resolvedMode, rolloutDiagnostics), budget.timeoutMs)
      if (typeof output === 'object' && output && 'timeout' in output) {
        return this.finalizeRuntimeHealth(this.fallback(request, 'processing-timeout', true, startedAt, preset.id, authoring, qualityBudget), true)
      }

      const result: CacheEntry = {
        ok: true,
        src: request.src,
        outputUrl: output.presentation.outputUrl,
        canvas: output.presentation.canvas,
        width: output.presentation.width,
        height: output.presentation.height,
        preset: preset.id,
        algorithmVersion: EWA_GALLERY_ALGORITHM_VERSION,
        lastUsedAt: Date.now(),
        destroy: output.destroy,
        diagnostics: addTimingWarnings({
          ...output.diagnostics,
          status: 'ready',
          preset: preset.id,
          totalMs: roundEwaMs(nowForEwaDiagnostics() - startedAt),
          outputMode: output.presentation.outputUrl ? 'ewa-object-url' : 'ewa-canvas',
          presentation: output.presentation.diagnostics,
          authoring,
          runtimeHealth: createEwaRuntimeHealthDiagnostics(getEwaRuntimeHealthSnapshot()),
          rollout: rolloutDiagnostics,
          warnings: [
            ...(output.diagnostics.warnings || []),
            ...(output.presentation.diagnostics.warnings || []),
          ],
        }),
      }
      const finalized = this.finalizeRuntimeHealth(result, true) as CacheEntry
      this.cache.set(key, finalized)
      this.evict()
      return finalized
    } catch (error) {
      return this.finalizeRuntimeHealth(this.fallback(request, toEwaFallbackReason(error), false, startedAt, preset.id, authoring, qualityBudget), true)
    }
  }

  private finalizeRuntimeHealth(result: EwaGalleryProcessResult, shouldRecord: boolean): EwaGalleryProcessResult {
    const snapshot = shouldRecord
      ? recordEwaRuntimeHealthResult({
          ok: result.ok,
          status: result.diagnostics.status,
          fallbackReason: result.fallbackReason,
          totalMs: result.diagnostics.totalMs,
        })
      : getEwaRuntimeHealthSnapshot()
    return {
      ...result,
      diagnostics: addTimingWarnings({
        ...result.diagnostics,
        runtimeHealth: createEwaRuntimeHealthDiagnostics(snapshot),
      }),
    }
  }

  private async renderWithWebGpu(
    runtime: EwaWebGpuRuntime,
    request: EwaGalleryProcessRequest,
    preset: EwaGalleryPreset,
    authoring: ResolvedEwaAuthoringMetadata,
    budget: EwaQualityBudget,
    tierReason: any[],
    requestedMode: EwaComputeMode,
    resolvedMode: EwaComputeMode,
    rolloutDiagnostics: EwaRolloutDiagnostics,
  ): Promise<{ presentation: EwaCanvasPresentation; diagnostics: EwaProcessDiagnostics; destroy: () => void }> {
    let bitmap: ImageBitmap | null = null
    let source: EwaSourceTexture | null = null
    let output: EwaComputeOutput | EwaAdaptiveTileComputeOutput | null = null
    let presentation: EwaCanvasPresentation | null = null

    const totalStart = nowForEwaDiagnostics()
    let decodeMs = 0
    let uploadMs = 0
    let computeMs = 0
    let presentMs = 0
    let computeMode: EwaComputeMode = resolvedMode
    let adaptiveFallback: 'none' | 'basic' | 'original' = 'none'
    let tileDiagnostics: EwaTileDiagnostics | undefined

    try {
      const decodeStart = nowForEwaDiagnostics()
      bitmap = await loadImageBitmapForEwa(request.src)
      decodeMs = nowForEwaDiagnostics() - decodeStart
      const originalTarget = {
        width: Math.max(1, Math.round(request.targetWidth || bitmap.width)),
        height: Math.max(1, Math.round(request.targetHeight || bitmap.height)),
        dpr: getEwaDevicePixelRatio(),
      }
      const target = clampEwaTargetToBudget(originalTarget, budget)
      const qualityBudget = createEwaQualityBudgetDiagnostics({
        budget,
        tierReason,
        requestedMode,
        resolvedMode,
        originalTargetWidth: originalTarget.width,
        originalTargetHeight: originalTarget.height,
        resolvedTargetWidth: target.width,
        resolvedTargetHeight: target.height,
        targetClamped: target.clamped,
      })
      if (shouldSkipUpscale(bitmap.width, bitmap.height, target.width, target.height)) {
        throw new Error('EWA upscale path skipped')
      }

      const uploadStart = nowForEwaDiagnostics()
      source = await uploadImageBitmapToTexture(runtime.device, bitmap, 'vt_ewa_gallery_src')
      uploadMs = nowForEwaDiagnostics() - uploadStart

      const computeStart = nowForEwaDiagnostics()
      if (computeMode === 'adaptive-tile' && preset.adaptive?.enabled && budget.allowAdaptiveTile) {
        try {
          const adaptiveOutput = await runAdaptiveEwaTileDownscale({
            device: runtime.device,
            source,
            targetWidth: target.width,
            targetHeight: target.height,
            preset,
            adaptive: preset.adaptive,
            label: 'vt_ewa_gallery_adaptive_dst',
          })
          output = adaptiveOutput
          tileDiagnostics = adaptiveOutput.tileDiagnostics
        } catch {
          adaptiveFallback = 'basic'
          computeMode = 'basic'
          output = await runEwaAnisoDownscale({
            device: runtime.device,
            source,
            targetWidth: target.width,
            targetHeight: target.height,
            preset,
            label: 'vt_ewa_gallery_dst',
          })
        }
      } else {
        computeMode = 'basic'
        output = await runEwaAnisoDownscale({
          device: runtime.device,
          source,
          targetWidth: target.width,
          targetHeight: target.height,
          preset,
          label: 'vt_ewa_gallery_dst',
        })
      }
      computeMs = nowForEwaDiagnostics() - computeStart
      if (isAdaptiveOutput(output)) tileDiagnostics = output.tileDiagnostics

      const presentStart = nowForEwaDiagnostics()
      presentation = await presentEwaTextureToCanvas(runtime.device, runtime.canvasFormat, output, {
        label: computeMode === 'adaptive-tile' ? 'vt_ewa_gallery_adaptive_present' : 'vt_ewa_gallery_present',
      })
      presentMs = nowForEwaDiagnostics() - presentStart
      output.destroy?.()
      source.destroy?.()
      output = null
      source = null

      const destroy = () => {
        presentation?.destroy?.()
      }
      const diagnostics = addTimingWarnings({
        preset: preset.id,
        status: 'ready',
        sourceWidth: bitmap.width,
        sourceHeight: bitmap.height,
        targetWidth: target.width,
        targetHeight: target.height,
        devicePixelRatio: target.dpr,
        decodeMs: roundEwaMs(decodeMs),
        uploadMs: roundEwaMs(uploadMs),
        computeMs: roundEwaMs(computeMs),
        presentMs: roundEwaMs(presentMs),
        totalMs: roundEwaMs(nowForEwaDiagnostics() - totalStart),
        cacheHit: false,
        outputMode: presentation.outputUrl ? 'ewa-object-url' : 'ewa-canvas',
        computeMode,
        adaptiveFallback,
        tileDiagnostics,
        presentation: presentation.diagnostics,
        authoring,
        qualityBudget,
        warnings: [...(presentation.diagnostics.warnings || [])],
      })
      return { presentation, diagnostics, destroy }
    } finally {
      closeEwaImageBitmap(bitmap)
      output?.destroy?.()
      source?.destroy?.()
    }
  }

  private fallback(
    request: EwaGalleryProcessRequest,
    reason: EwaFallbackReason | string,
    timedOut = false,
    startedAt?: number,
    resolvedPreset?: EwaGalleryPresetId,
    authoring?: ResolvedEwaAuthoringMetadata,
    qualityBudget?: EwaQualityBudgetDiagnostics,
    runtimeHealth?: import('./ewaRuntimeHealth').EwaRuntimeHealthDiagnostics,
    rollout?: EwaRolloutDiagnostics,
  ): EwaGalleryProcessResult {
    const preset = resolvedPreset || (request.preset as EwaGalleryPresetId) || 'auto'
    const width = Math.max(1, Math.round(request.targetWidth || request.sourceWidth || 1))
    const height = Math.max(1, Math.round(request.targetHeight || request.sourceHeight || 1))
    return {
      ok: false,
      src: request.src,
      width,
      height,
      preset,
      algorithmVersion: EWA_GALLERY_ALGORITHM_VERSION,
      fallbackReason: reason,
      timedOut,
      diagnostics: createFallbackEwaDiagnostics({
        preset,
        reason,
        sourceWidth: request.sourceWidth,
        sourceHeight: request.sourceHeight,
        targetWidth: width,
        targetHeight: height,
        devicePixelRatio: getEwaDevicePixelRatio(),
        totalMs: startedAt != null ? nowForEwaDiagnostics() - startedAt : undefined,
        authoring,
        qualityBudget,
        runtimeHealth,
        rollout,
      }),
    }
  }

  private evict(): void {
    if (this.cache.size <= this.maxEntries) return
    const entries = [...this.cache.entries()].sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt)
    for (const [key, entry] of entries.slice(0, Math.max(0, this.cache.size - this.maxEntries))) {
      entry.destroy?.()
      if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl)
      this.cache.delete(key)
    }
  }
}

let sharedProcessor: EwaGalleryProcessor | null = null

export function getSharedEwaGalleryProcessor(): EwaGalleryProcessor {
  if (!sharedProcessor) sharedProcessor = new EwaGalleryProcessor(3)
  return sharedProcessor
}

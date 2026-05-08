import type { EwaComputeMode } from './ewaTypes'
import type { EwaDeviceTier, EwaDeviceTierReason } from './ewaDeviceTier'

export type EwaQualityBudget = {
  tier: EwaDeviceTier
  maxTargetWidth: number
  maxTargetHeight: number
  timeoutMs: number
  allowAdaptiveTile: boolean
  allowBasicEwa: boolean
  preferOriginalFallback: boolean
  maxCacheEntries: number
  maxDevicePixelRatio: number
}

export type EwaQualityBudgetDiagnostics = {
  tier: EwaDeviceTier
  tierReason: EwaDeviceTierReason[]
  maxTargetWidth: number
  maxTargetHeight: number
  timeoutMs: number
  maxDevicePixelRatio: number
  allowAdaptiveTile: boolean
  allowBasicEwa: boolean
  requestedMode?: EwaComputeMode
  resolvedMode?: EwaComputeMode | 'original'
  targetClamped: boolean
  originalTargetWidth?: number
  originalTargetHeight?: number
  resolvedTargetWidth?: number
  resolvedTargetHeight?: number
}

export const EWA_QUALITY_BUDGETS: Record<EwaDeviceTier, EwaQualityBudget> = {
  unsupported: {
    tier: 'unsupported',
    maxTargetWidth: 0,
    maxTargetHeight: 0,
    timeoutMs: 0,
    allowAdaptiveTile: false,
    allowBasicEwa: false,
    preferOriginalFallback: true,
    maxCacheEntries: 0,
    maxDevicePixelRatio: 1,
  },
  low: {
    tier: 'low',
    maxTargetWidth: 960,
    maxTargetHeight: 960,
    timeoutMs: 1800,
    allowAdaptiveTile: false,
    allowBasicEwa: true,
    preferOriginalFallback: false,
    maxCacheEntries: 1,
    maxDevicePixelRatio: 1.25,
  },
  medium: {
    tier: 'medium',
    maxTargetWidth: 1440,
    maxTargetHeight: 1440,
    timeoutMs: 3000,
    allowAdaptiveTile: true,
    allowBasicEwa: true,
    preferOriginalFallback: false,
    maxCacheEntries: 3,
    maxDevicePixelRatio: 1.5,
  },
  high: {
    tier: 'high',
    maxTargetWidth: 1920,
    maxTargetHeight: 1920,
    timeoutMs: 3500,
    allowAdaptiveTile: true,
    allowBasicEwa: true,
    preferOriginalFallback: false,
    maxCacheEntries: 5,
    maxDevicePixelRatio: 2,
  },
}

export const EWA_ABSOLUTE_MAX_TIMEOUT_MS = 4000

export function resolveEwaQualityBudget(tier: EwaDeviceTier): EwaQualityBudget {
  const budget = EWA_QUALITY_BUDGETS[tier] || EWA_QUALITY_BUDGETS.medium
  return {
    ...budget,
    timeoutMs: Math.min(EWA_ABSOLUTE_MAX_TIMEOUT_MS, budget.timeoutMs),
  }
}

export function clampEwaTargetToBudget(
  target: { width: number; height: number; dpr?: number },
  budget: EwaQualityBudget,
): { width: number; height: number; dpr: number; clamped: boolean } {
  const originalWidth = Math.max(1, Math.round(target.width || 1))
  const originalHeight = Math.max(1, Math.round(target.height || 1))
  const requestedDpr = Math.max(1, target.dpr || 1)
  const resolvedDpr = Math.min(requestedDpr, budget.maxDevicePixelRatio || 1)
  if (budget.maxTargetWidth <= 0 || budget.maxTargetHeight <= 0) {
    return { width: 1, height: 1, dpr: resolvedDpr, clamped: true }
  }

  const scale = Math.min(1, budget.maxTargetWidth / originalWidth, budget.maxTargetHeight / originalHeight)
  const width = Math.max(1, Math.round(originalWidth * scale))
  const height = Math.max(1, Math.round(originalHeight * scale))
  return {
    width,
    height,
    dpr: resolvedDpr,
    clamped: width !== originalWidth || height !== originalHeight || resolvedDpr !== requestedDpr,
  }
}

export function resolveEwaModeWithinBudget(
  requestedMode: EwaComputeMode,
  budget: EwaQualityBudget,
): EwaComputeMode | 'original' {
  if (budget.preferOriginalFallback || (!budget.allowBasicEwa && !budget.allowAdaptiveTile)) return 'original'
  if (requestedMode === 'adaptive-tile' && !budget.allowAdaptiveTile) {
    return budget.allowBasicEwa ? 'basic' : 'original'
  }
  if (requestedMode === 'basic' && !budget.allowBasicEwa) return 'original'
  return requestedMode
}

export function createEwaQualityBudgetDiagnostics(input: {
  budget: EwaQualityBudget
  tierReason: EwaDeviceTierReason[]
  requestedMode?: EwaComputeMode
  resolvedMode?: EwaComputeMode | 'original'
  originalTargetWidth?: number
  originalTargetHeight?: number
  resolvedTargetWidth?: number
  resolvedTargetHeight?: number
  targetClamped?: boolean
}): EwaQualityBudgetDiagnostics {
  return {
    tier: input.budget.tier,
    tierReason: input.tierReason,
    maxTargetWidth: input.budget.maxTargetWidth,
    maxTargetHeight: input.budget.maxTargetHeight,
    timeoutMs: input.budget.timeoutMs,
    maxDevicePixelRatio: input.budget.maxDevicePixelRatio,
    allowAdaptiveTile: input.budget.allowAdaptiveTile,
    allowBasicEwa: input.budget.allowBasicEwa,
    requestedMode: input.requestedMode,
    resolvedMode: input.resolvedMode,
    targetClamped: Boolean(input.targetClamped),
    originalTargetWidth: input.originalTargetWidth,
    originalTargetHeight: input.originalTargetHeight,
    resolvedTargetWidth: input.resolvedTargetWidth,
    resolvedTargetHeight: input.resolvedTargetHeight,
  }
}

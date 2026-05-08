import type {
  EwaImageAuthoringMetadata,
  EwaRolloutDecisionReason,
  EwaRolloutMode,
  EwaRolloutSource,
} from './ewaTypes'
import type { EwaRuntimeHealthState } from './ewaRuntimeHealth'

export type EwaRolloutDecision = {
  allowed: boolean
  mode: EwaRolloutMode
  reason: EwaRolloutDecisionReason
  source: EwaRolloutSource
  debugEnabled: boolean
  metadataPresent: boolean
}

export type EwaRolloutDecisionInput = {
  mode: EwaRolloutMode
  source: EwaRolloutSource
  debugEnabled: boolean
  media?: EwaImageAuthoringMetadata
  runtimeHealthState?: EwaRuntimeHealthState
  webGpuSupported?: boolean
}

export type EwaRolloutDiagnostics = {
  mode: EwaRolloutMode
  allowed: boolean
  reason: EwaRolloutDecisionReason
  source: EwaRolloutSource
  debugEnabled: boolean
  metadataPresent: boolean
}

export function hasEwaAuthoringMetadata(media?: EwaImageAuthoringMetadata): boolean {
  if (!media) return false
  return Boolean(
    media.ewaEnabled === true ||
    media.ewaPreset ||
    media.ewaMode ||
    media.pixelSafe === true ||
    media.ewaNote,
  )
}

export function resolveEwaRolloutDecision(input: EwaRolloutDecisionInput): EwaRolloutDecision {
  const metadataPresent = hasEwaAuthoringMetadata(input.media)
  const base = {
    mode: input.mode,
    source: input.source,
    debugEnabled: input.debugEnabled,
    metadataPresent,
  }

  if (input.media?.ewaEnabled === false) {
    return { ...base, allowed: false, reason: 'metadata-disabled' }
  }
  if (input.media?.pixelSafe === true) {
    return { ...base, allowed: false, reason: 'pixel-safe' }
  }
  if (input.mode === 'off') {
    return { ...base, allowed: false, reason: 'rollout-off' }
  }
  if (input.runtimeHealthState === 'cooldown' || input.runtimeHealthState === 'disabled') {
    return { ...base, allowed: false, reason: 'runtime-health-blocked' }
  }
  if (input.webGpuSupported === false) {
    return { ...base, allowed: false, reason: 'webgpu-unsupported' }
  }
  if (input.mode === 'debug-only' && !input.debugEnabled) {
    return { ...base, allowed: false, reason: 'debug-only-without-debug' }
  }
  if (input.mode === 'metadata-only') {
    return metadataPresent
      ? { ...base, allowed: true, reason: 'metadata-enabled' }
      : { ...base, allowed: false, reason: 'metadata-required' }
  }

  return { ...base, allowed: true, reason: 'rollout-enabled' }
}

export function createEwaRolloutDiagnostics(decision: EwaRolloutDecision): EwaRolloutDiagnostics {
  return {
    mode: decision.mode,
    allowed: decision.allowed,
    reason: decision.reason,
    source: decision.source,
    debugEnabled: decision.debugEnabled,
    metadataPresent: decision.metadataPresent,
  }
}

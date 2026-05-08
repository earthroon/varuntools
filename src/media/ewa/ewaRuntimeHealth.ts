import { isEwaDebugEnabled } from './ewaDebug'
import type { EwaDeviceTier } from './ewaDeviceTier'
import type { EwaFallbackReason } from './ewaTypes'

export type EwaRuntimeHealthState = 'healthy' | 'degraded' | 'cooldown' | 'disabled'

export type EwaRuntimeHealthReason =
  | 'slow-processing'
  | 'repeated-timeout'
  | 'repeated-fallback'
  | 'device-lost'
  | 'presentation-failure'
  | 'webgpu-unsupported'
  | 'manual-debug-override'

export type EwaRuntimeHealthSnapshot = {
  state: EwaRuntimeHealthState
  reasons: EwaRuntimeHealthReason[]
  attempts: number
  successes: number
  failures: number
  timeouts: number
  deviceLost: number
  recentTotalMs: number[]
  cooldownUntil?: number
  recommendedTier?: EwaDeviceTier
}

export type EwaRuntimeHealthDiagnostics = {
  state: EwaRuntimeHealthState
  reasons: EwaRuntimeHealthReason[]
  attempts: number
  successes: number
  failures: number
  timeouts: number
  deviceLost: number
  cooldownActive: boolean
  cooldownRemainingMs?: number
  recommendedTier?: EwaDeviceTier
}

export type EwaRuntimeHealthRecord = {
  ok: boolean
  status?: string
  fallbackReason?: EwaFallbackReason | string
  totalMs?: number
}

export const EWA_RUNTIME_HEALTH_SESSION_KEY = 'vt:ewa-health'
export const EWA_RUNTIME_HEALTH_OVERRIDE_KEY = 'vt:ewa-health-override'
export const EWA_RUNTIME_COOLDOWN_MS = 60_000
export const EWA_RUNTIME_HEALTH_MAX_RECENT = 8

const SLOW_PROCESSING_MS = 2_500
const DEGRADED_FALLBACKS = 2
const COOLDOWN_TIMEOUTS = 2
const COOLDOWN_DEVICE_LOST = 1
const COOLDOWN_FAILURES = 4

const initialSnapshot: EwaRuntimeHealthSnapshot = {
  state: 'healthy',
  reasons: [],
  attempts: 0,
  successes: 0,
  failures: 0,
  timeouts: 0,
  deviceLost: 0,
  recentTotalMs: [],
}

let runtimeHealth: EwaRuntimeHealthSnapshot = { ...initialSnapshot, recentTotalMs: [] }

function now(): number {
  return Date.now()
}

function uniqueReasons(reasons: EwaRuntimeHealthReason[]): EwaRuntimeHealthReason[] {
  return [...new Set(reasons)]
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function getEwaRuntimeHealthOverride(): EwaRuntimeHealthState | 'auto' {
  if (!isEwaDebugEnabled() || typeof window === 'undefined') return 'auto'
  try {
    const sessionValue = window.sessionStorage?.getItem(EWA_RUNTIME_HEALTH_SESSION_KEY)
    if (sessionValue === 'healthy' || sessionValue === 'degraded' || sessionValue === 'cooldown' || sessionValue === 'disabled') return sessionValue
    const localValue = window.localStorage?.getItem(EWA_RUNTIME_HEALTH_OVERRIDE_KEY)
    if (localValue === 'healthy' || localValue === 'degraded' || localValue === 'cooldown' || localValue === 'disabled') return localValue
  } catch {}
  return 'auto'
}

export function resetEwaRuntimeHealth(): void {
  runtimeHealth = { ...initialSnapshot, recentTotalMs: [] }
  try {
    if (canUseStorage()) window.sessionStorage.removeItem(EWA_RUNTIME_HEALTH_SESSION_KEY)
  } catch {}
}

export function getEwaRuntimeHealthSnapshot(at = now()): EwaRuntimeHealthSnapshot {
  const override = getEwaRuntimeHealthOverride()
  if (override !== 'auto') {
    const cooldownUntil = override === 'cooldown' ? at + EWA_RUNTIME_COOLDOWN_MS : runtimeHealth.cooldownUntil
    return {
      ...runtimeHealth,
      state: override,
      reasons: uniqueReasons([...runtimeHealth.reasons, 'manual-debug-override']),
      cooldownUntil,
      recommendedTier: override === 'degraded' || override === 'cooldown' ? 'low' : runtimeHealth.recommendedTier,
    }
  }

  if (runtimeHealth.state === 'cooldown' && runtimeHealth.cooldownUntil && runtimeHealth.cooldownUntil <= at) {
    runtimeHealth = {
      ...runtimeHealth,
      state: 'degraded',
      reasons: uniqueReasons(runtimeHealth.reasons.filter((reason) => reason !== 'repeated-timeout')),
      cooldownUntil: undefined,
      recommendedTier: 'low',
    }
  }
  return runtimeHealth
}

export function isEwaRuntimeCooldownActive(snapshot = getEwaRuntimeHealthSnapshot()): boolean {
  return snapshot.state === 'cooldown' && Boolean(snapshot.cooldownUntil == null || snapshot.cooldownUntil > now())
}

function reasonForFallback(reason?: string): EwaRuntimeHealthReason | undefined {
  if (!reason) return undefined
  if (reason === 'processing-timeout') return 'repeated-timeout'
  if (reason === 'device-lost') return 'device-lost'
  if (reason === 'webgpu-unsupported' || reason === 'adapter-unavailable' || reason === 'device-request-failed') return 'webgpu-unsupported'
  if (reason.startsWith('presentation-')) return 'presentation-failure'
  return 'repeated-fallback'
}

function recommendedTierFor(state: EwaRuntimeHealthState): EwaDeviceTier | undefined {
  if (state === 'degraded' || state === 'cooldown') return 'low'
  if (state === 'disabled') return 'unsupported'
  return undefined
}

function persistHealthState(snapshot: EwaRuntimeHealthSnapshot): void {
  try {
    if (!canUseStorage()) return
    // Session-only state. Do not store long-term health in localStorage.
    if (snapshot.state === 'cooldown' || snapshot.state === 'disabled') {
      window.sessionStorage.setItem(EWA_RUNTIME_HEALTH_SESSION_KEY, snapshot.state)
    } else {
      window.sessionStorage.removeItem(EWA_RUNTIME_HEALTH_SESSION_KEY)
    }
  } catch {}
}

export function recordEwaRuntimeHealthResult(record: EwaRuntimeHealthRecord, at = now()): EwaRuntimeHealthSnapshot {
  const current = getEwaRuntimeHealthSnapshot(at)
  if (current.state === 'disabled') return current

  const fallbackReason = String(record.fallbackReason || '')
  const runtimeReason = reasonForFallback(fallbackReason)
  const totalMs = Number(record.totalMs || 0)
  const recentTotalMs = Number.isFinite(totalMs) && totalMs > 0
    ? [...current.recentTotalMs, totalMs].slice(-EWA_RUNTIME_HEALTH_MAX_RECENT)
    : current.recentTotalMs.slice(-EWA_RUNTIME_HEALTH_MAX_RECENT)

  const attempts = current.attempts + 1
  const successes = current.successes + (record.ok ? 1 : 0)
  const failures = current.failures + (record.ok ? 0 : 1)
  const timeouts = current.timeouts + (fallbackReason === 'processing-timeout' || record.status === 'timeout' ? 1 : 0)
  const deviceLost = current.deviceLost + (fallbackReason === 'device-lost' ? 1 : 0)
  const slowCount = recentTotalMs.filter((value) => value > SLOW_PROCESSING_MS).length

  const reasons = uniqueReasons([
    ...current.reasons,
    ...(runtimeReason ? [runtimeReason] : []),
    ...(slowCount >= 2 ? ['slow-processing' as const] : []),
  ])

  let state: EwaRuntimeHealthState = 'healthy'
  if (deviceLost >= COOLDOWN_DEVICE_LOST || timeouts >= COOLDOWN_TIMEOUTS || failures >= COOLDOWN_FAILURES) {
    state = 'cooldown'
  } else if (failures >= DEGRADED_FALLBACKS || timeouts >= 1 || slowCount >= 2) {
    state = 'degraded'
  }

  const next: EwaRuntimeHealthSnapshot = {
    state,
    reasons: state === 'healthy' ? [] : reasons,
    attempts,
    successes,
    failures,
    timeouts,
    deviceLost,
    recentTotalMs,
    cooldownUntil: state === 'cooldown' ? at + EWA_RUNTIME_COOLDOWN_MS : undefined,
    recommendedTier: recommendedTierFor(state),
  }

  runtimeHealth = next
  persistHealthState(next)
  return next
}

export function applyRuntimeHealthToTier(tier: EwaDeviceTier, snapshot = getEwaRuntimeHealthSnapshot()): EwaDeviceTier {
  if (snapshot.state === 'disabled' || snapshot.state === 'cooldown') return 'unsupported'
  if (snapshot.state !== 'degraded') return tier
  if (tier === 'high') return 'medium'
  if (tier === 'medium') return 'low'
  return tier
}

export function createEwaRuntimeHealthDiagnostics(snapshot = getEwaRuntimeHealthSnapshot(), at = now()): EwaRuntimeHealthDiagnostics {
  const cooldownRemainingMs = snapshot.cooldownUntil != null ? Math.max(0, snapshot.cooldownUntil - at) : undefined
  return {
    state: snapshot.state,
    reasons: snapshot.reasons,
    attempts: snapshot.attempts,
    successes: snapshot.successes,
    failures: snapshot.failures,
    timeouts: snapshot.timeouts,
    deviceLost: snapshot.deviceLost,
    cooldownActive: snapshot.state === 'cooldown' && (cooldownRemainingMs == null || cooldownRemainingMs > 0),
    cooldownRemainingMs,
    recommendedTier: snapshot.recommendedTier,
  }
}

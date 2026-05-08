import { isEwaDebugEnabled } from './ewaDebug'
import type { EwaDeviceDiagnostics } from './ewaDiagnostics'

export type EwaDeviceTier = 'unsupported' | 'low' | 'medium' | 'high'

export type EwaDeviceTierReason =
  | 'webgpu-unsupported'
  | 'adapter-unavailable'
  | 'device-request-failed'
  | 'limited-texture-size'
  | 'missing-required-features'
  | 'low-device-memory'
  | 'slow-previous-processing'
  | 'debug-override'
  | 'default-medium'

export type EwaDeviceTierDecision = {
  tier: EwaDeviceTier
  reasons: EwaDeviceTierReason[]
}

export type EwaStoredDeviceTier = Exclude<EwaDeviceTier, 'unsupported'> | 'auto'

function getDeviceMemory(): number | undefined {
  if (typeof navigator === 'undefined') return undefined
  const memory = Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory)
  return Number.isFinite(memory) ? memory : undefined
}

export function getEwaTierOverride(): EwaStoredDeviceTier {
  if (!isEwaDebugEnabled() || typeof window === 'undefined') return 'auto'
  try {
    const raw = window.localStorage?.getItem('vt:ewa-tier')
    if (raw === 'low' || raw === 'medium' || raw === 'high' || raw === 'auto') return raw
  } catch {}
  return 'auto'
}

export function resolveEwaDeviceTier(input: {
  diagnostics?: EwaDeviceDiagnostics | null
  previousTotalMs?: number
  previousTimeoutCount?: number
} = {}): EwaDeviceTierDecision {
  const override = getEwaTierOverride()
  if (override === 'low' || override === 'medium' || override === 'high') {
    return { tier: override, reasons: ['debug-override'] }
  }

  const diagnostics = input.diagnostics
  const failure = diagnostics?.failureReason
  if (!diagnostics || diagnostics.supported === false) {
    if (failure === 'adapter-unavailable') return { tier: 'unsupported', reasons: ['adapter-unavailable'] }
    if (failure === 'device-request-failed') return { tier: 'unsupported', reasons: ['device-request-failed'] }
    return { tier: 'unsupported', reasons: ['webgpu-unsupported'] }
  }

  const reasons: EwaDeviceTierReason[] = []
  const maxTexture = Number(diagnostics.limits?.maxTextureDimension2D || 0)
  if (maxTexture > 0 && maxTexture < 4096) reasons.push('limited-texture-size')

  const memory = getDeviceMemory()
  if (memory != null && memory <= 4) reasons.push('low-device-memory')

  if ((input.previousTimeoutCount || 0) >= 2 || (input.previousTotalMs || 0) > 2500) {
    reasons.push('slow-previous-processing')
  }

  if (reasons.includes('limited-texture-size') || reasons.includes('low-device-memory') || reasons.includes('slow-previous-processing')) {
    return { tier: 'low', reasons }
  }

  if (maxTexture >= 8192 && (memory == null || memory >= 8)) {
    return { tier: 'high', reasons: reasons.length ? reasons : ['default-medium'] }
  }

  return { tier: 'medium', reasons: reasons.length ? reasons : ['default-medium'] }
}

import type { EwaComputeMode } from './ewaTypes'

export type EwaCompareMode = 'off' | 'original' | 'processed' | 'split'
export type EwaStoredComputeMode = EwaComputeMode | 'auto'
export type EwaStoredDeviceTier = 'low' | 'medium' | 'high' | 'auto'

declare global {
  interface Window {
    __VT_EWA_DEBUG__?: boolean
  }
}

export function isEwaDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (window.__VT_EWA_DEBUG__) return true
  try {
    return window.localStorage?.getItem('vt:ewa-debug') === 'true'
  } catch {
    return false
  }
}

export function getEwaCompareMode(): EwaCompareMode {
  if (!isEwaDebugEnabled()) return 'off'
  try {
    const raw = window.localStorage?.getItem('vt:ewa-compare')
    if (raw === 'original' || raw === 'processed' || raw === 'split') return raw
  } catch {}
  return 'off'
}

export function getEwaComputeMode(): EwaStoredComputeMode {
  if (!isEwaDebugEnabled()) return 'auto'
  try {
    const raw = window.localStorage?.getItem('vt:ewa-mode')
    if (raw === 'basic' || raw === 'adaptive-tile' || raw === 'auto') return raw
  } catch {}
  return 'auto'
}


export function getEwaDeviceTierOverride(): EwaStoredDeviceTier {
  if (!isEwaDebugEnabled()) return 'auto'
  try {
    const raw = window.localStorage?.getItem('vt:ewa-tier')
    if (raw === 'low' || raw === 'medium' || raw === 'high' || raw === 'auto') return raw
  } catch {}
  return 'auto'
}

export function isEwaCompareMode(value: unknown): value is EwaCompareMode {
  return value === 'off' || value === 'original' || value === 'processed' || value === 'split'
}

export function isEwaComputeMode(value: unknown): value is EwaStoredComputeMode {
  return value === 'basic' || value === 'adaptive-tile' || value === 'auto'
}

export function isEwaDeviceTierOverride(value: unknown): value is EwaStoredDeviceTier {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'auto'
}

export function getStoredEwaDebugValue(key: 'vt:ewa-debug' | 'vt:ewa-compare' | 'vt:ewa-mode' | 'vt:ewa-tier'): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage?.getItem(key) || ''
  } catch {
    return ''
  }
}

import { isEwaDebugEnabled } from './ewaDebug'
import type { EwaRolloutMode, EwaRolloutSource } from './ewaTypes'

export const EWA_ROLLOUT_ENV_KEY = 'VITE_EWA_ROLLOUT_MODE'
export const EWA_ROLLOUT_DEBUG_KEY = 'vt:ewa-rollout'
export const DEFAULT_EWA_ROLLOUT_MODE: EwaRolloutMode = 'metadata-only'

export function isEwaRolloutMode(value: unknown): value is EwaRolloutMode {
  return value === 'off' || value === 'debug-only' || value === 'metadata-only' || value === 'enabled'
}

function readEwaEnvRolloutMode(): EwaRolloutMode | undefined {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    const raw = env?.[EWA_ROLLOUT_ENV_KEY]
    return isEwaRolloutMode(raw) ? raw : undefined
  } catch {
    return undefined
  }
}

export function getEwaRolloutDebugOverride(): EwaRolloutMode | undefined {
  if (!isEwaDebugEnabled() || typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage?.getItem(EWA_ROLLOUT_DEBUG_KEY)
    return isEwaRolloutMode(raw) ? raw : undefined
  } catch {
    return undefined
  }
}

export type ResolvedEwaRolloutFeatureMode = {
  mode: EwaRolloutMode
  source: EwaRolloutSource
  debugEnabled: boolean
}

export function resolveEwaRolloutFeatureMode(): ResolvedEwaRolloutFeatureMode {
  const debugEnabled = isEwaDebugEnabled()
  const debugOverride = getEwaRolloutDebugOverride()
  if (debugOverride) return { mode: debugOverride, source: 'debug-override', debugEnabled }

  const envMode = readEwaEnvRolloutMode()
  if (envMode) return { mode: envMode, source: 'env', debugEnabled }

  return { mode: DEFAULT_EWA_ROLLOUT_MODE, source: 'default', debugEnabled }
}

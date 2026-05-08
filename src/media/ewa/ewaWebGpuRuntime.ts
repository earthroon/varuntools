import type { EwaFallbackReason } from './ewaTypes'
import type { EwaDeviceDiagnostics } from './ewaDiagnostics'

export type EwaGpuRuntimeState =
  | 'idle'
  | 'unsupported'
  | 'adapter-unavailable'
  | 'initializing'
  | 'ready'
  | 'failed'
  | 'lost'

export type EwaWebGpuRuntime = {
  state: EwaGpuRuntimeState
  fallbackReason?: EwaFallbackReason
  gpu: any
  adapter: any
  device: any
  canvasFormat: string
  destroy: () => void
}

let runtimePromise: Promise<EwaWebGpuRuntime> | null = null
let runtimeState: EwaGpuRuntimeState = 'idle'
let runtimeFallbackReason: EwaFallbackReason | undefined

export function getEwaGpuRuntimeState(): EwaGpuRuntimeState {
  return runtimeState
}

export function getEwaGpuFallbackReason(): EwaFallbackReason | undefined {
  return runtimeFallbackReason
}

function getNavigatorGpu(): any | null {
  if (typeof navigator === 'undefined') return null
  return (navigator as Navigator & { gpu?: any }).gpu || null
}

export function canUseEwaWebGpu(): boolean {
  return Boolean(getNavigatorGpu())
}

function makeRuntime(state: EwaGpuRuntimeState, fallbackReason?: EwaFallbackReason, gpu: any = null, adapter: any = null, device: any = null): EwaWebGpuRuntime {
  runtimeState = state
  runtimeFallbackReason = fallbackReason
  return {
    state,
    fallbackReason,
    gpu,
    adapter,
    device,
    canvasFormat: 'rgba8unorm',
    destroy: () => undefined,
  }
}

export async function getEwaWebGpuRuntime(): Promise<EwaWebGpuRuntime> {
  if (runtimePromise) return runtimePromise

  runtimeState = 'initializing'
  runtimeFallbackReason = undefined
  runtimePromise = (async () => {
    const gpu = getNavigatorGpu()
    if (!gpu) return makeRuntime('unsupported', 'webgpu-unsupported')

    try {
      const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
      if (!adapter) return makeRuntime('adapter-unavailable', 'adapter-unavailable', gpu)

      let device: any
      try {
        device = await adapter.requestDevice()
      } catch {
        runtimePromise = null
        return makeRuntime('failed', 'device-request-failed', gpu, adapter)
      }

      const canvasFormat = typeof gpu.getPreferredCanvasFormat === 'function'
        ? gpu.getPreferredCanvasFormat()
        : 'bgra8unorm'

      device.lost?.then?.(() => {
        runtimePromise = null
        runtimeState = 'lost'
        runtimeFallbackReason = 'device-lost'
      }).catch?.(() => undefined)

      runtimeState = 'ready'
      runtimeFallbackReason = undefined
      return {
        state: 'ready',
        gpu,
        adapter,
        device,
        canvasFormat,
        destroy: () => {
          try { device.destroy?.() } catch {}
          runtimePromise = null
          runtimeState = 'idle'
          runtimeFallbackReason = undefined
        },
      }
    } catch {
      runtimePromise = null
      return makeRuntime('failed', 'device-request-failed', gpu)
    }
  })()

  return runtimePromise
}

function toLimitRecord(limits: any): Record<string, number> {
  const names = [
    'maxTextureDimension1D',
    'maxTextureDimension2D',
    'maxTextureDimension3D',
    'maxTextureArrayLayers',
    'maxBindGroups',
    'maxComputeWorkgroupStorageSize',
    'maxComputeInvocationsPerWorkgroup',
    'maxComputeWorkgroupSizeX',
    'maxComputeWorkgroupSizeY',
    'maxComputeWorkgroupsPerDimension',
  ]
  const out: Record<string, number> = {}
  for (const name of names) {
    const value = Number(limits?.[name])
    if (Number.isFinite(value)) out[name] = value
  }
  return out
}

export async function getEwaDeviceDiagnostics(): Promise<EwaDeviceDiagnostics> {
  const gpu = getNavigatorGpu()
  if (!gpu) {
    return { supported: false, features: [], limits: {}, failureReason: 'webgpu-unsupported' }
  }
  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'high-performance' })
    if (!adapter) {
      return { supported: false, features: [], limits: {}, failureReason: 'adapter-unavailable' }
    }
    const features = adapter.features ? Array.from(adapter.features).map(String) : []
    const preferredCanvasFormat = typeof gpu.getPreferredCanvasFormat === 'function'
      ? gpu.getPreferredCanvasFormat()
      : undefined
    return {
      supported: true,
      adapterName: typeof adapter.name === 'string' ? adapter.name : undefined,
      features,
      limits: toLimitRecord(adapter.limits),
      preferredCanvasFormat,
    }
  } catch {
    return { supported: false, features: [], limits: {}, failureReason: 'device-request-failed' }
  }
}

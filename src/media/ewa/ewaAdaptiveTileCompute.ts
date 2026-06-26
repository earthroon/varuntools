import type { EwaPresetConfig, EwaTileDiagnostics } from './ewaTypes'
import type { EwaSourceTexture } from './ewaTextureUpload'
import { runEwaFastDownscale, type EwaFastDownscaleOutput } from './ewaFastDownscaleCompute'
import { runEwaQmapLodCompute, type EwaQmapLodOutput } from './ewaQmapLodCompute'
import { runEwaTileMaskCompute, type EwaTileMaskOutput } from './ewaTileMaskCompute'
import { runEwaAdaptiveComposite, type EwaAdaptiveCompositeOutput } from './ewaAdaptiveCompositeCompute'

export type EwaAdaptiveTileComputeRequest = {
  device: any
  source: EwaSourceTexture
  targetWidth: number
  targetHeight: number
  preset: EwaPresetConfig
  adaptive: EwaPresetConfig['adaptive']
  label?: string
  qmap?: Pick<EwaSourceTexture, 'texture' | 'view' | 'width' | 'height'>
}

export type EwaAdaptiveTileComputeOutput = {
  texture: any
  view: any
  width: number
  height: number
  format: string
  tileDiagnostics: EwaTileDiagnostics
  destroy: () => void
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function curve01(q: number, mode: string | undefined, gamma: number | undefined): number {
  const qq = clamp01(q)
  const g = Math.max(0.1, Number.isFinite(Number(gamma)) ? Number(gamma) : 1)
  if (mode === 'pow') return Math.pow(qq, g)
  const s = qq * qq * (3 - 2 * qq)
  return g === 1 ? s : Math.pow(s, g)
}

function resolveQThreshold(adaptive: EwaPresetConfig['adaptive']): number {
  const fromUi = (() => {
    try {
      const value = (globalThis as any).DadumGPUParams?.qThresh
      return Number.isFinite(Number(value)) ? Number(value) : undefined
    } catch {
      return undefined
    }
  })()
  return clamp01(fromUi ?? adaptive.qThresh ?? 0.35)
}

function resolveQmapMix(adaptive: EwaPresetConfig['adaptive'], qThresh: number): number {
  const explicit = Number((adaptive as any).qLodMaxMix)
  if (Number.isFinite(explicit)) return clamp01(explicit)
  const curveMode = String((adaptive as any).qLodCurve || 'scurve')
  const curveGamma = Number((adaptive as any).qLodCurveGamma || 1)
  return clamp01(0.3 + 0.7 * curve01(qThresh, curveMode, curveGamma))
}

function resolveThresholdBand(adaptive: EwaPresetConfig['adaptive'], qThresh: number): { threshLo: number; threshHi: number } {
  const curveMode = String((adaptive as any).qLodCurve || 'scurve')
  const curveGamma = Number((adaptive as any).qLodCurveGamma || 1)
  const t = curve01(qThresh, curveMode, curveGamma)
  const style = String((adaptive as any).qLevelBandStyle || 'wideMid')
  const minBand = clamp01(Number((adaptive as any).qLevelBandMin ?? 0.05))
  const maxBand = clamp01(Number((adaptive as any).qLevelBandMax ?? 0.18))
  const x = 2 * t - 1
  const midPeak = 1 - x * x
  const shape = style === 'tightMid' ? 1 - midPeak : midPeak
  const band = minBand + (maxBand - minBand) * clamp01(shape)
  const threshHi = clamp01(t)
  const threshLo = clamp01(threshHi - band)
  return threshHi < threshLo ? { threshLo: threshHi, threshHi: threshLo } : { threshLo, threshHi }
}

export async function runAdaptiveEwaTileDownscale(request: EwaAdaptiveTileComputeRequest): Promise<EwaAdaptiveTileComputeOutput> {
  const { device, source, preset, adaptive } = request
  const dstW = Math.max(1, Math.round(request.targetWidth))
  const dstH = Math.max(1, Math.round(request.targetHeight))
  if (!adaptive.enabled) throw new Error('Adaptive EWA tile path is disabled for this preset')
  if (dstW >= source.width && dstH >= source.height) throw new Error('Adaptive EWA upscale path is intentionally skipped')

  const tilePx = Math.max(8, Math.round(adaptive.tilePx || 32))
  const tilesW = Math.max(1, Math.ceil(source.width / tilePx))
  const tilesH = Math.max(1, Math.ceil(source.height / tilePx))
  const qThresh = resolveQThreshold(adaptive)
  const qLodMaxMix = resolveQmapMix(adaptive, qThresh)
  const band = resolveThresholdBand(adaptive, qThresh)
  const qmapSource = request.qmap ? 'provided-qmap' : 'generated-from-source'

  let fast: EwaFastDownscaleOutput | null = null
  let qmapLod: EwaQmapLodOutput | null = null
  let tileMask: EwaTileMaskOutput | null = null
  let composite: EwaAdaptiveCompositeOutput | null = null

  const encoder = device.createCommandEncoder({ label: 'vt_ewa_gallery_adaptive_multipass_encoder' })
  try {
    qmapLod = await runEwaQmapLodCompute({
      device,
      source: request.qmap || source,
      tilesW,
      tilesH,
      tilePx,
      mixK: qLodMaxMix,
      label: 'vt_ewa_gallery_qmap_lod',
      encoder,
    })

    tileMask = await runEwaTileMaskCompute({
      device,
      qmapLod,
      tilePx,
      qThresh,
      threshLo: band.threshLo,
      threshHi: band.threshHi,
      qmapSource,
      qLodMaxMix,
      label: 'vt_ewa_gallery_tilemask',
      encoder,
    })

    fast = await runEwaFastDownscale({
      device,
      source,
      targetWidth: dstW,
      targetHeight: dstH,
      mode: adaptive.fastMode || 'box',
      label: 'vt_ewa_gallery_fast_downscale',
      encoder,
    })

    composite = await runEwaAdaptiveComposite({
      device,
      source,
      fast,
      tileMask,
      targetWidth: dstW,
      targetHeight: dstH,
      preset,
      label: request.label || 'vt_ewa_gallery_adaptive_composite',
      encoder,
    })

    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone?.()

    const output = composite
    composite = null
    const diagnostics = tileMask.diagnostics
    return {
      texture: output.texture,
      view: output.view,
      width: output.width,
      height: output.height,
      format: output.format,
      tileDiagnostics: diagnostics,
      destroy: () => {
        try { output.destroy?.() } catch {}
        try { fast?.destroy?.() } catch {}
        try { qmapLod?.destroy?.() } catch {}
        try { tileMask?.destroy?.() } catch {}
      },
    }
  } catch (error) {
    try { composite?.destroy?.() } catch {}
    try { fast?.destroy?.() } catch {}
    try { qmapLod?.destroy?.() } catch {}
    try { tileMask?.destroy?.() } catch {}
    throw error
  }
}

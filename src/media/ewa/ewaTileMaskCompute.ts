import { EWA_TILEMASK_FROM_QMAP_WGSL } from './ewaWgslSources'
import type { EwaTileDiagnostics } from './ewaTypes'
import type { EwaQmapLodOutput } from './ewaQmapLodCompute'

export type EwaTileMaskRequest = {
  device: any
  qmapLod: EwaQmapLodOutput
  tilePx: number
  qThresh: number
  threshLo?: number
  threshHi?: number
  qmapSource: 'generated-from-source' | 'provided-qmap'
  qLodMaxMix: number
  label?: string
  encoder?: any
}

export type EwaTileMaskOutput = {
  maskTexture: any
  maskView: any
  tilesW: number
  tilesH: number
  tilePx: number
  diagnostics: EwaTileDiagnostics
  destroy: () => void
}

export const EWA_TILEMASK_BINDING_CONTRACT = {
  kernel: 'textureLoad',
  bindings: [
    { binding: 0, name: 'qmapLodTex', type: 'texture_2d<f32>' },
    { binding: 1, name: 'outMask', type: 'texture_storage_2d<rgba8uint, write>' },
    { binding: 2, name: 'params', type: 'uniform' },
  ],
} as const

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

function getGpuConstants() {
  return {
    textureUsage: (globalThis as any).GPUTextureUsage,
    bufferUsage: (globalThis as any).GPUBufferUsage,
    shaderStage: (globalThis as any).GPUShaderStage,
  }
}

function packParams(tilesW: number, tilesH: number, threshLo: number, threshHi: number): ArrayBuffer {
  const buf = new ArrayBuffer(32)
  const u32 = new Uint32Array(buf)
  const f32 = new Float32Array(buf)
  u32[0] = tilesW >>> 0
  u32[1] = tilesH >>> 0
  f32[4] = threshLo
  f32[5] = threshHi
  return buf
}

function estimateLevelDiagnostics(input: {
  tilesW: number
  tilesH: number
  tilePx: number
  qThresh: number
  threshLo: number
  threshHi: number
  qmapSource: 'generated-from-source' | 'provided-qmap'
  qLodMaxMix: number
}): EwaTileDiagnostics {
  const totalTiles = Math.max(1, input.tilesW * input.tilesH)
  const q = clamp01(input.qThresh)
  const hiPressure = clamp01(1 - input.threshHi)
  const loPressure = clamp01(1 - input.threshLo)
  const level2Count = Math.min(totalTiles, Math.max(0, Math.round(totalTiles * (0.04 + hiPressure * 0.18))))
  const activeTarget = Math.min(totalTiles, Math.max(level2Count, Math.round(totalTiles * (0.10 + loPressure * 0.24 + (1 - q) * 0.08))))
  const level1Count = Math.max(0, activeTarget - level2Count)
  const level0Count = Math.max(0, totalTiles - level1Count - level2Count)
  const activeTileCount = level1Count + level2Count
  return {
    tilePx: input.tilePx,
    tilesW: input.tilesW,
    tilesH: input.tilesH,
    totalTiles,
    level0Count,
    level1Count,
    level2Count,
    activeTileCount,
    activeTileRatio: Math.round((activeTileCount / totalTiles) * 1000) / 1000,
    qThresh: q,
    qmapSource: input.qmapSource,
    qLodMaxMix: input.qLodMaxMix,
  }
}

export async function runEwaTileMaskCompute(request: EwaTileMaskRequest): Promise<EwaTileMaskOutput> {
  const { device, qmapLod } = request
  const tilesW = Math.max(1, Math.round(qmapLod.width))
  const tilesH = Math.max(1, Math.round(qmapLod.height))
  const tilePx = Math.max(8, Math.round(request.tilePx || 32))
  const threshHi = clamp01(request.threshHi ?? request.qThresh ?? 0.35)
  const band = Math.max(0.05, Math.min(0.18, threshHi * (1 - threshHi) * 0.72))
  const threshLo = clamp01(request.threshLo ?? (threshHi - band))
  const { textureUsage, bufferUsage, shaderStage } = getGpuConstants()
  if (!textureUsage || !bufferUsage || !shaderStage) throw new Error('WebGPU constants unavailable')

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'vt_ewa_tilemask_bgl_texture_load',
    entries: [
      { binding: 0, visibility: shaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
      { binding: 1, visibility: shaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8uint' } },
      { binding: 2, visibility: shaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  })
  const pipeline = device.createComputePipeline({
    label: request.label || 'vt_ewa_tilemask_pipeline',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    compute: { module: device.createShaderModule({ code: EWA_TILEMASK_FROM_QMAP_WGSL }), entryPoint: 'main' },
  })
  const maskTexture = device.createTexture({
    label: request.label || 'vt_ewa_tilemask_rgba8uint',
    size: [tilesW, tilesH, 1],
    format: 'rgba8uint',
    usage:
      textureUsage.STORAGE_BINDING |
      textureUsage.TEXTURE_BINDING |
      textureUsage.COPY_SRC |
      textureUsage.COPY_DST,
  })
  const maskView = maskTexture.createView()
  const params = device.createBuffer({ label: 'vt_ewa_tilemask_params', size: 32, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST })
  device.queue.writeBuffer(params, 0, packParams(tilesW, tilesH, threshLo, threshHi))
  const bindGroup = device.createBindGroup({
    label: 'vt_ewa_tilemask_bg',
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: qmapLod.view || qmapLod.texture.createView() },
      { binding: 1, resource: maskView },
      { binding: 2, resource: { buffer: params } },
    ],
  })
  const ownsEncoder = !request.encoder
  const encoder = request.encoder || device.createCommandEncoder({ label: 'vt_ewa_tilemask_encoder' })
  const pass = encoder.beginComputePass({ label: 'vt_ewa_tilemask_pass' })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.dispatchWorkgroups(Math.ceil(tilesW / 8), Math.ceil(tilesH / 8))
  pass.end()
  if (ownsEncoder) {
    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone?.()
  }
  try { params.destroy?.() } catch {}

  const diagnostics = estimateLevelDiagnostics({
    tilesW,
    tilesH,
    tilePx,
    qThresh: request.qThresh,
    threshLo,
    threshHi,
    qmapSource: request.qmapSource,
    qLodMaxMix: request.qLodMaxMix,
  })
  return { maskTexture, maskView, tilesW, tilesH, tilePx, diagnostics, destroy: () => { try { maskTexture.destroy?.() } catch {} } }
}


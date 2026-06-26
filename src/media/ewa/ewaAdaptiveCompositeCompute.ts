import { EWA_ADAPTIVE_COMPOSITE_WGSL } from './ewaWgslSources'
import type { EwaPresetConfig } from './ewaTypes'
import type { EwaSourceTexture } from './ewaTextureUpload'
import type { EwaFastDownscaleOutput } from './ewaFastDownscaleCompute'
import type { EwaTileMaskOutput } from './ewaTileMaskCompute'

export type EwaAdaptiveCompositeRequest = {
  device: any
  source: EwaSourceTexture
  fast: EwaFastDownscaleOutput
  tileMask: EwaTileMaskOutput
  targetWidth: number
  targetHeight: number
  preset: EwaPresetConfig
  label?: string
  encoder?: any
}

export type EwaAdaptiveCompositeOutput = {
  texture: any
  view: any
  width: number
  height: number
  format: 'rgba16float'
  destroy: () => void
}

export const EWA_ADAPTIVE_COMPOSITE_BINDING_CONTRACT = {
  kernel: 'textureSample+textureLoad',
  bindings: [
    { binding: 0, name: 'srcTex', type: 'texture_2d<f32>' },
    { binding: 1, name: 's0', type: 'sampler' },
    { binding: 2, name: 'fastTex', type: 'texture_2d<f32>' },
    { binding: 3, name: 'tileMaskTex', type: 'texture_2d<u32>' },
    { binding: 4, name: 'outTex', type: 'texture_storage_2d<rgba16float, write>' },
    { binding: 5, name: 'params', type: 'uniform' },
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

function numberOr(value: unknown, fallback: number): number {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function packParams(input: {
  srcW: number
  srcH: number
  dstW: number
  dstH: number
  preset: EwaPresetConfig
  tileMask: EwaTileMaskOutput
}): ArrayBuffer {
  const buf = new ArrayBuffer(96)
  const u32 = new Uint32Array(buf)
  const f32 = new Float32Array(buf)
  const adaptive = input.preset.adaptive || ({} as EwaPresetConfig['adaptive'])
  const params = input.preset.params
  u32[0] = input.srcW >>> 0
  u32[1] = input.srcH >>> 0
  u32[2] = input.dstW >>> 0
  u32[3] = input.dstH >>> 0
  f32[4] = input.srcW / Math.max(1, input.dstW)
  f32[5] = input.srcH / Math.max(1, input.dstH)
  f32[6] = numberOr(adaptive.radiusMul, params.radiusMul)
  f32[7] = numberOr(adaptive.sigma, params.sigma)
  f32[8] = numberOr(params.anisoAngle, 0)
  f32[9] = Math.max(1, numberOr(params.anisoAspect, 1))
  f32[10] = numberOr(adaptive.deThresh, params.deThresh)
  f32[11] = Math.max(0, numberOr(adaptive.deSoft, params.deSoft))
  f32[12] = clamp01(numberOr(adaptive.deK, params.deK))
  u32[13] = input.tileMask.tilePx >>> 0
  u32[14] = input.tileMask.tilesW >>> 0
  u32[15] = input.tileMask.tilesH >>> 0
  f32[16] = clamp01(numberOr(adaptive.deK1Scale, 0.25))
  f32[17] = numberOr(adaptive.deThresh1Add, 0.12)
  f32[18] = Math.max(0, numberOr(adaptive.deSoft1Mul, 1.35))
  return buf
}

export async function runEwaAdaptiveComposite(request: EwaAdaptiveCompositeRequest): Promise<EwaAdaptiveCompositeOutput> {
  const { device, source, fast, tileMask, preset } = request
  const dstW = Math.max(1, Math.round(request.targetWidth))
  const dstH = Math.max(1, Math.round(request.targetHeight))
  const { textureUsage, bufferUsage, shaderStage } = getGpuConstants()
  if (!textureUsage || !bufferUsage || !shaderStage) throw new Error('WebGPU constants unavailable')

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'vt_ewa_adaptive_composite_bgl_explicit',
    entries: [
      { binding: 0, visibility: shaderStage.COMPUTE, texture: { sampleType: 'float' } },
      { binding: 1, visibility: shaderStage.COMPUTE, sampler: { type: 'filtering' } },
      { binding: 2, visibility: shaderStage.COMPUTE, texture: { sampleType: 'float' } },
      { binding: 3, visibility: shaderStage.COMPUTE, texture: { sampleType: 'uint' } },
      { binding: 4, visibility: shaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba16float' } },
      { binding: 5, visibility: shaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  })
  const pipeline = device.createComputePipeline({
    label: request.label || 'vt_ewa_adaptive_composite_pipeline',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    compute: { module: device.createShaderModule({ code: EWA_ADAPTIVE_COMPOSITE_WGSL }), entryPoint: 'main' },
  })
  const outputTexture = device.createTexture({
    label: request.label || 'vt_ewa_adaptive_composite_dst',
    size: [dstW, dstH, 1],
    format: 'rgba16float',
    usage:
      textureUsage.STORAGE_BINDING |
      textureUsage.TEXTURE_BINDING |
      textureUsage.COPY_SRC |
      textureUsage.COPY_DST |
      textureUsage.RENDER_ATTACHMENT,
  })
  const outputView = outputTexture.createView()
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })
  const params = device.createBuffer({ label: 'vt_ewa_adaptive_composite_params', size: 96, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST })
  device.queue.writeBuffer(params, 0, packParams({ srcW: source.width, srcH: source.height, dstW, dstH, preset, tileMask }))
  const bindGroup = device.createBindGroup({
    label: 'vt_ewa_adaptive_composite_bg',
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: source.view || source.texture.createView() },
      { binding: 1, resource: sampler },
      { binding: 2, resource: fast.view || fast.texture.createView() },
      { binding: 3, resource: tileMask.maskView || tileMask.maskTexture.createView() },
      { binding: 4, resource: outputView },
      { binding: 5, resource: { buffer: params } },
    ],
  })

  const ownsEncoder = !request.encoder
  const encoder = request.encoder || device.createCommandEncoder({ label: 'vt_ewa_adaptive_composite_encoder' })
  const pass = encoder.beginComputePass({ label: 'vt_ewa_adaptive_composite_pass' })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.dispatchWorkgroups(Math.ceil(dstW / 8), Math.ceil(dstH / 8))
  pass.end()
  if (ownsEncoder) {
    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone?.()
  }
  if (ownsEncoder) { try { params.destroy?.() } catch {} }
  return { texture: outputTexture, view: outputView, width: dstW, height: dstH, format: 'rgba16float', destroy: () => { try { outputTexture.destroy?.() } catch {}; try { params.destroy?.() } catch {} } }
}


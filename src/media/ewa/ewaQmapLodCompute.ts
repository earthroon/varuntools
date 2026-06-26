import { EWA_QMAP_LOD_MEANMAX_MIX_WGSL } from './ewaWgslSources'
import type { EwaSourceTexture } from './ewaTextureUpload'

export type EwaQmapSource = Pick<EwaSourceTexture, 'texture' | 'view' | 'width' | 'height'>

export type EwaQmapLodRequest = {
  device: any
  source: EwaQmapSource
  tilesW: number
  tilesH: number
  tilePx: number
  mixK: number
  label?: string
  encoder?: any
}

export type EwaQmapLodOutput = {
  texture: any
  view: any
  width: number
  height: number
  format: 'rgba16float'
  qLodMaxMix: number
  destroy: () => void
}

export const EWA_QMAP_LOD_BINDING_CONTRACT = {
  kernel: 'textureLoad',
  bindings: [
    { binding: 0, name: 'srcTex', type: 'texture_2d<f32>' },
    { binding: 1, name: 'dstTex', type: 'texture_storage_2d<rgba16float, write>' },
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

function packParams(srcW: number, srcH: number, dstW: number, dstH: number, tilePx: number, mixK: number): ArrayBuffer {
  const buf = new ArrayBuffer(64)
  const u32 = new Uint32Array(buf)
  const f32 = new Float32Array(buf)
  u32[0] = srcW >>> 0
  u32[1] = srcH >>> 0
  u32[2] = dstW >>> 0
  u32[3] = dstH >>> 0
  u32[4] = Math.max(1, Math.round(tilePx)) >>> 0
  f32[6] = clamp01(mixK)
  return buf
}

export async function runEwaQmapLodCompute(request: EwaQmapLodRequest): Promise<EwaQmapLodOutput> {
  const { device, source } = request
  const dstW = Math.max(1, Math.round(request.tilesW))
  const dstH = Math.max(1, Math.round(request.tilesH))
  const mixK = clamp01(request.mixK)
  const { textureUsage, bufferUsage, shaderStage } = getGpuConstants()
  if (!textureUsage || !bufferUsage || !shaderStage) throw new Error('WebGPU constants unavailable')

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'vt_ewa_qmap_lod_bgl_texture_load',
    entries: [
      { binding: 0, visibility: shaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
      { binding: 1, visibility: shaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba16float' } },
      { binding: 2, visibility: shaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  })
  const pipeline = device.createComputePipeline({
    label: request.label || 'vt_ewa_qmap_lod_pipeline',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    compute: { module: device.createShaderModule({ code: EWA_QMAP_LOD_MEANMAX_MIX_WGSL }), entryPoint: 'main' },
  })
  const outputTexture = device.createTexture({
    label: request.label || 'vt_ewa_qmap_lod_dst',
    size: [dstW, dstH, 1],
    format: 'rgba16float',
    usage:
      textureUsage.STORAGE_BINDING |
      textureUsage.TEXTURE_BINDING |
      textureUsage.COPY_SRC |
      textureUsage.COPY_DST,
  })
  const outputView = outputTexture.createView()
  const params = device.createBuffer({ label: 'vt_ewa_qmap_lod_params', size: 64, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST })
  device.queue.writeBuffer(params, 0, packParams(source.width, source.height, dstW, dstH, request.tilePx, mixK))
  const bindGroup = device.createBindGroup({
    label: 'vt_ewa_qmap_lod_bg',
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: source.view || source.texture.createView() },
      { binding: 1, resource: outputView },
      { binding: 2, resource: { buffer: params } },
    ],
  })
  const ownsEncoder = !request.encoder
  const encoder = request.encoder || device.createCommandEncoder({ label: 'vt_ewa_qmap_lod_encoder' })
  const pass = encoder.beginComputePass({ label: 'vt_ewa_qmap_lod_pass' })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.dispatchWorkgroups(Math.ceil(dstW / 8), Math.ceil(dstH / 8))
  pass.end()
  if (ownsEncoder) {
    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone?.()
  }
  if (ownsEncoder) { try { params.destroy?.() } catch {} }
  return { texture: outputTexture, view: outputView, width: dstW, height: dstH, format: 'rgba16float', qLodMaxMix: mixK, destroy: () => { try { outputTexture.destroy?.() } catch {}; try { params.destroy?.() } catch {} } }
}


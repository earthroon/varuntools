import { EWA_FAST_DOWNSCALE_WGSL } from './ewaWgslSources'
import type { EwaSourceTexture } from './ewaTextureUpload'

export type EwaFastDownscaleMode = 'box' | 'bilinear'

export type EwaFastDownscaleRequest = {
  device: any
  source: EwaSourceTexture
  targetWidth: number
  targetHeight: number
  mode?: EwaFastDownscaleMode
  label?: string
  encoder?: any
}

export type EwaFastDownscaleOutput = {
  texture: any
  view: any
  width: number
  height: number
  format: 'rgba16float'
  destroy: () => void
}

export const EWA_FAST_DOWNSCALE_BINDING_CONTRACT = {
  kernel: 'textureSample',
  bindings: [
    { binding: 0, name: 'srcTex', type: 'texture_2d<f32>' },
    { binding: 1, name: 'srcSmp', type: 'sampler' },
    { binding: 2, name: 'dstTex', type: 'texture_storage_2d<rgba16float, write>' },
    { binding: 3, name: 'params', type: 'uniform' },
  ],
} as const

function getGpuConstants() {
  return {
    textureUsage: (globalThis as any).GPUTextureUsage,
    bufferUsage: (globalThis as any).GPUBufferUsage,
    shaderStage: (globalThis as any).GPUShaderStage,
  }
}

function modeToU32(mode: EwaFastDownscaleMode | undefined): number {
  return mode === 'box' ? 1 : 0
}

function packParams(srcW: number, srcH: number, dstW: number, dstH: number, mode: EwaFastDownscaleMode | undefined): ArrayBuffer {
  const buf = new ArrayBuffer(32)
  const u32 = new Uint32Array(buf)
  u32[0] = srcW >>> 0
  u32[1] = srcH >>> 0
  u32[2] = dstW >>> 0
  u32[3] = dstH >>> 0
  u32[4] = modeToU32(mode) >>> 0
  return buf
}

export async function runEwaFastDownscale(request: EwaFastDownscaleRequest): Promise<EwaFastDownscaleOutput> {
  const { device, source } = request
  const dstW = Math.max(1, Math.round(request.targetWidth))
  const dstH = Math.max(1, Math.round(request.targetHeight))
  const { textureUsage, bufferUsage, shaderStage } = getGpuConstants()
  if (!textureUsage || !bufferUsage || !shaderStage) throw new Error('WebGPU constants unavailable')

  const bindGroupLayout = device.createBindGroupLayout({
    label: 'vt_ewa_fast_downscale_bgl_texture_sample',
    entries: [
      { binding: 0, visibility: shaderStage.COMPUTE, texture: { sampleType: 'float' } },
      { binding: 1, visibility: shaderStage.COMPUTE, sampler: { type: 'filtering' } },
      { binding: 2, visibility: shaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba16float' } },
      { binding: 3, visibility: shaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  })
  const pipeline = device.createComputePipeline({
    label: request.label || 'vt_ewa_fast_downscale_pipeline',
    layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
    compute: { module: device.createShaderModule({ code: EWA_FAST_DOWNSCALE_WGSL }), entryPoint: 'main' },
  })

  const outputTexture = device.createTexture({
    label: request.label || 'vt_ewa_fast_downscale_dst',
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
  const params = device.createBuffer({
    label: 'vt_ewa_fast_downscale_params',
    size: 32,
    usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(params, 0, packParams(source.width, source.height, dstW, dstH, request.mode))

  const bindGroup = device.createBindGroup({
    label: 'vt_ewa_fast_downscale_bg',
    layout: bindGroupLayout,
    entries: [
      { binding: 0, resource: source.view || source.texture.createView() },
      { binding: 1, resource: sampler },
      { binding: 2, resource: outputView },
      { binding: 3, resource: { buffer: params } },
    ],
  })

  const ownsEncoder = !request.encoder
  const encoder = request.encoder || device.createCommandEncoder({ label: 'vt_ewa_fast_downscale_encoder' })
  const pass = encoder.beginComputePass({ label: 'vt_ewa_fast_downscale_pass' })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.dispatchWorkgroups(Math.ceil(dstW / 8), Math.ceil(dstH / 8))
  pass.end()
  if (ownsEncoder) {
    device.queue.submit([encoder.finish()])
    await device.queue.onSubmittedWorkDone?.()
  }
  if (ownsEncoder) { try { params.destroy?.() } catch {} }
  return {
    texture: outputTexture,
    view: outputView,
    width: dstW,
    height: dstH,
    format: 'rgba16float',
    destroy: () => { try { outputTexture.destroy?.() } catch {}; try { params.destroy?.() } catch {} },
  }
}


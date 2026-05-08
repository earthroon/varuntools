import type { EwaPresetConfig } from './ewaTypes'
import type { EwaSourceTexture } from './ewaTextureUpload'
import { EWA_ANISO_DOWNSCALE_WGSL } from './ewaWgslSources'

export type EwaComputeRequest = {
  device: any
  source: EwaSourceTexture
  targetWidth: number
  targetHeight: number
  preset: EwaPresetConfig
  label?: string
}

export type EwaComputeOutput = {
  texture: any
  view: any
  width: number
  height: number
  format: string
  destroy: () => void
}

function getGpuConstants() {
  return {
    textureUsage: (globalThis as any).GPUTextureUsage,
    bufferUsage: (globalThis as any).GPUBufferUsage,
  }
}

function packParams(srcW: number, srcH: number, dstW: number, dstH: number, preset: EwaPresetConfig): ArrayBuffer {
  const buf = new ArrayBuffer(64)
  const u32 = new Uint32Array(buf)
  const f32 = new Float32Array(buf)
  u32[0] = srcW >>> 0
  u32[1] = srcH >>> 0
  u32[2] = dstW >>> 0
  u32[3] = dstH >>> 0
  f32[4] = srcW / Math.max(1, dstW)
  f32[5] = srcH / Math.max(1, dstH)
  f32[6] = preset.params.radiusMul
  f32[7] = preset.params.sigma
  f32[8] = preset.params.anisoAngle
  f32[9] = Math.max(1, preset.params.anisoAspect)
  f32[10] = preset.params.deThresh
  f32[11] = Math.max(0, preset.params.deSoft)
  f32[12] = Math.max(0, Math.min(1, preset.params.deK))
  f32[13] = 0
  return buf
}

export async function runEwaAnisoDownscale(request: EwaComputeRequest): Promise<EwaComputeOutput> {
  const { device, source, preset } = request
  const dstW = Math.max(1, Math.round(request.targetWidth))
  const dstH = Math.max(1, Math.round(request.targetHeight))
  if (dstW >= source.width && dstH >= source.height) throw new Error('EWA upscale path is intentionally skipped')

  const { textureUsage, bufferUsage } = getGpuConstants()
  if (!textureUsage || !bufferUsage) throw new Error('WebGPU usage constants unavailable')

  const outputTexture = device.createTexture({
    label: request.label || 'vt_ewa_gallery_dst',
    size: [dstW, dstH, 1],
    format: 'rgba16float',
    usage: textureUsage.STORAGE_BINDING | textureUsage.TEXTURE_BINDING,
  })
  const outputView = outputTexture.createView()

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })
  const params = device.createBuffer({
    label: 'vt_ewa_gallery_params',
    size: 64,
    usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(params, 0, packParams(source.width, source.height, dstW, dstH, preset))

  const pipeline = device.createComputePipeline({
    label: 'vt_ewa_gallery_compute',
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: EWA_ANISO_DOWNSCALE_WGSL }), entryPoint: 'main' },
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: source.view || source.texture.createView() },
      { binding: 1, resource: sampler },
      { binding: 2, resource: outputView },
      { binding: 3, resource: { buffer: params } },
    ],
  })

  const encoder = device.createCommandEncoder({ label: 'vt_ewa_gallery_compute_encoder' })
  const pass = encoder.beginComputePass({ label: 'vt_ewa_gallery_compute_pass' })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.dispatchWorkgroups(Math.ceil(dstW / 8), Math.ceil(dstH / 8))
  pass.end()
  device.queue.submit([encoder.finish()])
  await device.queue.onSubmittedWorkDone?.()

  try { params.destroy?.() } catch {}

  return {
    texture: outputTexture,
    view: outputView,
    width: dstW,
    height: dstH,
    format: 'rgba16float',
    destroy: () => {
      try { outputTexture.destroy?.() } catch {}
    },
  }
}

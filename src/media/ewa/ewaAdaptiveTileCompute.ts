import type { EwaPresetConfig } from './ewaTypes'
import type { EwaSourceTexture } from './ewaTextureUpload'
import { EWA_ADAPTIVE_TILE_DOWNSCALE_WGSL } from './ewaWgslSources'
import { estimateEwaTileDiagnostics } from './ewaTileMask'
import type { EwaAdaptiveTileParams, EwaTileDiagnostics } from './ewaTypes'

export type EwaAdaptiveTileComputeRequest = {
  device: any
  source: EwaSourceTexture
  targetWidth: number
  targetHeight: number
  preset: EwaPresetConfig
  adaptive: EwaAdaptiveTileParams
  label?: string
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

function getGpuConstants() {
  return {
    textureUsage: (globalThis as any).GPUTextureUsage,
    bufferUsage: (globalThis as any).GPUBufferUsage,
  }
}

function packAdaptiveParams(srcW: number, srcH: number, dstW: number, dstH: number, preset: EwaPresetConfig, adaptive: EwaAdaptiveTileParams): ArrayBuffer {
  const buf = new ArrayBuffer(64)
  const u32 = new Uint32Array(buf)
  const f32 = new Float32Array(buf)
  u32[0] = srcW >>> 0
  u32[1] = srcH >>> 0
  u32[2] = dstW >>> 0
  u32[3] = dstH >>> 0
  f32[4] = srcW / Math.max(1, dstW)
  f32[5] = srcH / Math.max(1, dstH)
  f32[6] = adaptive.radiusMul || preset.params.radiusMul
  f32[7] = adaptive.sigma || preset.params.sigma
  f32[8] = adaptive.deThresh ?? preset.params.deThresh
  f32[9] = adaptive.deSoft ?? preset.params.deSoft
  f32[10] = adaptive.deK ?? preset.params.deK
  f32[11] = adaptive.qThresh
  u32[12] = Math.max(8, Math.round(adaptive.tilePx || 32)) >>> 0
  u32[13] = adaptive.fastMode === 'bilinear' ? 1 : 0
  u32[14] = 0
  u32[15] = 0
  return buf
}

export async function runAdaptiveEwaTileDownscale(request: EwaAdaptiveTileComputeRequest): Promise<EwaAdaptiveTileComputeOutput> {
  const { device, source, preset, adaptive } = request
  const dstW = Math.max(1, Math.round(request.targetWidth))
  const dstH = Math.max(1, Math.round(request.targetHeight))
  if (!adaptive.enabled) throw new Error('Adaptive EWA tile path is disabled for this preset')
  if (dstW >= source.width && dstH >= source.height) throw new Error('Adaptive EWA upscale path is intentionally skipped')

  const { textureUsage, bufferUsage } = getGpuConstants()
  if (!textureUsage || !bufferUsage) throw new Error('WebGPU usage constants unavailable')

  const tileDiagnostics = estimateEwaTileDiagnostics({
    source,
    targetWidth: dstW,
    targetHeight: dstH,
    adaptive,
  })

  const outputTexture = device.createTexture({
    label: request.label || 'vt_ewa_gallery_adaptive_dst',
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
    label: 'vt_ewa_gallery_adaptive_params',
    size: 64,
    usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST,
  })
  device.queue.writeBuffer(params, 0, packAdaptiveParams(source.width, source.height, dstW, dstH, preset, adaptive))
  const pipeline = device.createComputePipeline({
    label: 'vt_ewa_gallery_adaptive_compute',
    layout: 'auto',
    compute: {
      module: device.createShaderModule({ code: EWA_ADAPTIVE_TILE_DOWNSCALE_WGSL }),
      entryPoint: 'main',
    },
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

  const encoder = device.createCommandEncoder({ label: 'vt_ewa_gallery_adaptive_compute_encoder' })
  const pass = encoder.beginComputePass({ label: 'vt_ewa_gallery_adaptive_compute_pass' })
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
    tileDiagnostics,
    destroy: () => {
      try { outputTexture.destroy?.() } catch {}
    },
  }
}

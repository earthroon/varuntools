import { EWA_CANVAS_PRESENT_WGSL } from './ewaWgslSources'
import type { EwaComputeOutput } from './ewaWebGpuCompute'
import {
  createEwaPresentationPolicy,
  type EwaGpuTextureFormat,
  type EwaPresentationFormat,
  type EwaPresentationPolicy,
} from './ewaTypes'
import { type EwaPresentationDiagnostics } from './ewaDiagnostics'

export type EwaCanvasPresentation = {
  canvas: HTMLCanvasElement
  outputUrl?: string
  width: number
  height: number
  computeFormat: 'rgba16float'
  presentationFamily: 'rgba8unorm-srgb'
  canvasFormat: EwaGpuTextureFormat
  colorSpace: 'srgb'
  bitDepth: 8
  dynamicRange: 'sdr'
  outputFormat: EwaPresentationFormat
  outputQuality: number
  alphaMode: 'opaque' | 'premultiplied'
  diagnostics: EwaPresentationDiagnostics
  destroy: () => void
}

export class EwaPresentationError extends Error {
  reason: string

  constructor(reason: string, message = reason) {
    super(message)
    this.name = 'EwaPresentationError'
    this.reason = reason
  }
}

function getGpuTextureUsage(): any | null {
  return (globalThis as any).GPUTextureUsage || null
}

export async function presentEwaTextureToCanvas(
  device: any,
  canvasFormat: string,
  output: EwaComputeOutput,
  options: { canvas?: HTMLCanvasElement; label?: string; policy?: Partial<EwaPresentationPolicy> } = {},
): Promise<EwaCanvasPresentation> {
  const policy: EwaPresentationPolicy = {
    ...createEwaPresentationPolicy(canvasFormat),
    ...(options.policy || {}),
    computeFormat: 'rgba16float',
    presentationFamily: 'rgba8unorm-srgb',
    colorSpace: 'srgb',
    bitDepth: 8,
    dynamicRange: 'sdr',
  }
  const canvas = options.canvas || document.createElement('canvas')
  canvas.width = output.width
  canvas.height = output.height

  const context = canvas.getContext('webgpu') as any
  if (!context) throw new EwaPresentationError('presentation-canvas-failed', 'webgpu canvas context unavailable')
  try {
    const textureUsage = getGpuTextureUsage()
    context.configure({
      device,
      format: policy.canvasFormat,
      alphaMode: policy.alphaMode,
      ...(textureUsage
        ? { usage: textureUsage.RENDER_ATTACHMENT | textureUsage.COPY_DST | textureUsage.COPY_SRC }
        : {}),
    })
  } catch (error) {
    throw new EwaPresentationError('presentation-color-policy-failed', error instanceof Error ? error.message : 'canvas configure failed')
  }

  // Final surface is the canvas itself. Do not encode to Blob and do not feed it back into <img>.
  // Nearest avoids an extra presentation-time bilinear pass when the compute output already owns filtering.
  const sampler = device.createSampler({
    magFilter: 'nearest',
    minFilter: 'nearest',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })
  const module = device.createShaderModule({ code: EWA_CANVAS_PRESENT_WGSL })
  const pipeline = device.createRenderPipeline({
    label: options.label || 'vt_ewa_gallery_present_canvas_primary',
    layout: 'auto',
    vertex: { module, entryPoint: 'vs_main' },
    fragment: { module, entryPoint: 'fs_main', targets: [{ format: policy.canvasFormat }] },
    primitive: { topology: 'triangle-list' },
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: output.view || output.texture.createView() },
      { binding: 1, resource: sampler },
    ],
  })

  const encoder = device.createCommandEncoder({ label: 'vt_ewa_gallery_present_encoder' })
  const pass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      storeOp: 'store',
      clearValue: policy.alphaMode === 'opaque'
        ? { r: 0, g: 0, b: 0, a: 1 }
        : { r: 0, g: 0, b: 0, a: 0 },
    }],
  })
  pass.setPipeline(pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.draw(3, 1, 0, 0)
  pass.end()
  device.queue.submit([encoder.finish()])
  await device.queue.onSubmittedWorkDone?.()

  const diagnostics: EwaPresentationDiagnostics = {
    computeFormat: 'rgba16float',
    presentationFamily: 'rgba8unorm-srgb',
    canvasFormat: String(policy.canvasFormat),
    colorSpace: 'srgb',
    bitDepth: 8,
    dynamicRange: 'sdr',
    alphaMode: policy.alphaMode,
    outputFormat: policy.outputFormat,
    outputQuality: policy.outputQuality,
    objectUrlCreated: false,
    warnings: ['EWA_CANVAS_PRIMARY_NO_BLOB'],
  }

  return {
    canvas,
    width: output.width,
    height: output.height,
    computeFormat: 'rgba16float',
    presentationFamily: 'rgba8unorm-srgb',
    canvasFormat: policy.canvasFormat,
    colorSpace: 'srgb',
    bitDepth: 8,
    dynamicRange: 'sdr',
    outputFormat: policy.outputFormat,
    outputQuality: policy.outputQuality,
    alphaMode: policy.alphaMode,
    diagnostics,
    destroy: () => {
      try { canvas.width = 1; canvas.height = 1 } catch {}
    },
  }
}

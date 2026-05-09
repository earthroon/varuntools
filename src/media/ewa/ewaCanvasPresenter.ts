import { EWA_CANVAS_PRESENT_WGSL } from './ewaWgslSources'
import type { EwaComputeOutput } from './ewaWebGpuCompute'
import {
  createEwaPresentationPolicy,
  type EwaGpuTextureFormat,
  type EwaPresentationFormat,
  type EwaPresentationPolicy,
} from './ewaTypes'
import { nowForEwaDiagnostics, roundEwaMs, type EwaPresentationDiagnostics } from './ewaDiagnostics'

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

function mimeForFormat(format: EwaPresentationFormat): string {
  return format === 'png' ? 'image/png' : 'image/webp'
}

async function canvasToBlob(canvas: HTMLCanvasElement, format: EwaPresentationFormat, quality: number): Promise<Blob | null> {
  return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeForFormat(format), quality))
}

async function canvasToObjectUrl(
  canvas: HTMLCanvasElement,
  policy: EwaPresentationPolicy,
): Promise<{ outputUrl: string; format: EwaPresentationFormat; blobBytes: number; blobMs: number; warnings: string[] }> {
  const warnings: string[] = []
  const started = nowForEwaDiagnostics()
  let format = policy.outputFormat
  let blob = await canvasToBlob(canvas, format, policy.outputQuality)

  if (!blob && format !== 'png') {
    warnings.push('EWA_DIAG_OUTPUT_FORMAT_FALLBACK')
    format = 'png'
    blob = await canvasToBlob(canvas, format, 1)
  }

  if (!blob) {
    warnings.push('EWA_DIAG_BLOB_FAILED')
    throw new EwaPresentationError('presentation-blob-failed', 'EWA presentation canvas.toBlob failed')
  }

  return {
    outputUrl: URL.createObjectURL(blob),
    format,
    blobBytes: blob.size,
    blobMs: roundEwaMs(nowForEwaDiagnostics() - started) || 0,
    warnings,
  }
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
    context.configure({
      device,
      format: policy.canvasFormat,
      alphaMode: policy.alphaMode,
    })
  } catch (error) {
    throw new EwaPresentationError('presentation-color-policy-failed', error instanceof Error ? error.message : 'canvas configure failed')
  }

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  })
  const module = device.createShaderModule({ code: EWA_CANVAS_PRESENT_WGSL })
  const pipeline = device.createRenderPipeline({
    label: options.label || 'vt_ewa_gallery_present_srgb8',
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

  const encoded = await canvasToObjectUrl(canvas, policy)
  const diagnostics: EwaPresentationDiagnostics = {
    computeFormat: 'rgba16float',
    presentationFamily: 'rgba8unorm-srgb',
    canvasFormat: String(policy.canvasFormat),
    colorSpace: 'srgb',
    bitDepth: 8,
    dynamicRange: 'sdr',
    alphaMode: policy.alphaMode,
    outputFormat: encoded.format,
    outputQuality: policy.outputQuality,
    blobBytes: encoded.blobBytes,
    blobMs: encoded.blobMs,
    objectUrlCreated: true,
  }
  const outputUrl = encoded.outputUrl
  return {
    canvas,
    outputUrl,
    width: output.width,
    height: output.height,
    computeFormat: 'rgba16float',
    presentationFamily: 'rgba8unorm-srgb',
    canvasFormat: policy.canvasFormat,
    colorSpace: 'srgb',
    bitDepth: 8,
    dynamicRange: 'sdr',
    outputFormat: encoded.format,
    outputQuality: policy.outputQuality,
    alphaMode: policy.alphaMode,
    diagnostics: { ...diagnostics, warnings: encoded.warnings },
    destroy: () => {
      try { URL.revokeObjectURL(outputUrl) } catch {}
      try { canvas.width = 1; canvas.height = 1 } catch {}
    },
  }
}

import type { EwaFallbackReason } from './ewaTypes'

export type EwaSourceTexture = {
  texture: any
  view: any
  width: number
  height: number
  format: string
  destroy: () => void
}

export async function loadImageBitmapForEwa(src: string): Promise<ImageBitmap> {
  const response = await fetch(src, { mode: 'cors', credentials: 'same-origin' })
  if (!response.ok) throw new Error(`image fetch failed: ${response.status}`)
  const blob = await response.blob()
  return await createImageBitmap(blob)
}

export function getGpuTextureUsage(): any {
  return (globalThis as any).GPUTextureUsage
}

async function popValidationErrorScope(device: any): Promise<any | null> {
  if (typeof device?.popErrorScope !== 'function') return null
  try {
    return await device.popErrorScope()
  } catch {
    return null
  }
}

export async function uploadImageBitmapToTexture(
  device: any,
  bitmap: ImageBitmap,
  label = 'vt_ewa_gallery_src',
): Promise<EwaSourceTexture> {
  const textureUsage = getGpuTextureUsage()
  if (!textureUsage) throw new Error('WebGPU texture usage constants unavailable')

  const texture = device.createTexture({
    label,
    size: [bitmap.width, bitmap.height, 1],
    format: 'rgba8unorm',
    usage:
      textureUsage.COPY_DST |
      textureUsage.COPY_SRC |
      textureUsage.TEXTURE_BINDING |
      textureUsage.RENDER_ATTACHMENT,
  })

  const canUseErrorScope = typeof device?.pushErrorScope === 'function' && typeof device?.popErrorScope === 'function'
  let errorScopePushed = false

  try {
    if (canUseErrorScope) {
      device.pushErrorScope('validation')
      errorScopePushed = true
    }

    device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture },
      { width: bitmap.width, height: bitmap.height, depthOrArrayLayers: 1 },
    )

    if (errorScopePushed) {
      const validationError = await popValidationErrorScope(device)
      errorScopePushed = false
      if (validationError) {
        throw new Error(
          `EWA source texture upload validation failed: ${validationError.message || validationError}`,
        )
      }
    }

    return {
      texture,
      view: texture.createView(),
      width: bitmap.width,
      height: bitmap.height,
      format: 'rgba8unorm',
      destroy: () => {
        try { texture.destroy?.() } catch {}
      },
    }
  } catch (error) {
    try { texture.destroy?.() } catch {}
    if (errorScopePushed) await popValidationErrorScope(device)
    throw error
  }
}

export function closeEwaImageBitmap(bitmap: ImageBitmap | null | undefined): void {
  try { bitmap?.close?.() } catch {}
}

export function mapImageDecodeErrorReason(error: unknown): EwaFallbackReason {
  return error instanceof Error ? 'source-decode-failed' : 'source-decode-failed'
}

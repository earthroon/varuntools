import { computed, onBeforeUnmount, ref, type Ref } from 'vue'
import type { SectionLightboxItem } from '@/composables/useSectionLightbox'
import {
  getSharedEwaGalleryProcessor,
  type EwaGalleryProcessResult,
} from '@/media/ewa/ewaGalleryProcessor'
import { resolveEwaPresetFromAuthoring, resolveEwaComputeMode } from '@/media/ewa/ewaPresets'
import { createFallbackEwaDiagnostics } from '@/media/ewa/ewaDiagnostics'
import type { EwaComputeMode, EwaGalleryPresetId, EwaGalleryStatus, EwaImageAuthoringMetadata, EwaProcessToken } from '@/media/ewa/ewaTypes'

export type EwaGalleryProcessorOptions = {
  stageRef: Ref<HTMLElement | null>
}

function booleanFromMeta(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  const text = String(value ?? '').trim().toLowerCase()
  if (text === 'true') return true
  if (text === 'false') return false
  return undefined
}

function getMetaValue(meta: Record<string, unknown> | undefined, dotted: string): unknown {
  if (!meta) return undefined
  if (dotted in meta) return meta[dotted]
  const parts = dotted.split('.')
  let cursor: unknown = meta
  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) return undefined
    cursor = (cursor as Record<string, unknown>)[part]
  }
  return cursor
}

function getItemEwaMetadata(item: SectionLightboxItem | null): EwaImageAuthoringMetadata | undefined {
  const media = (item as unknown as { media?: EwaImageAuthoringMetadata })?.media
  const meta = item?.meta as Record<string, unknown> | undefined
  const metadata: EwaImageAuthoringMetadata = {
    ewaPreset: String(media?.ewaPreset ?? getMetaValue(meta, 'media.ewaPreset') ?? getMetaValue(meta, 'ewaPreset') ?? '').trim() || undefined,
    ewaMode: String(media?.ewaMode ?? getMetaValue(meta, 'media.ewaMode') ?? getMetaValue(meta, 'ewaMode') ?? '').trim() || undefined,
    pixelSafe: media?.pixelSafe ?? booleanFromMeta(getMetaValue(meta, 'media.pixelSafe') ?? getMetaValue(meta, 'pixelSafe')),
    ewaEnabled: media?.ewaEnabled ?? booleanFromMeta(getMetaValue(meta, 'media.ewaEnabled') ?? getMetaValue(meta, 'ewaEnabled')),
    ewaNote: String(media?.ewaNote ?? getMetaValue(meta, 'media.ewaNote') ?? getMetaValue(meta, 'ewaNote') ?? '').trim() || undefined,
  }
  return Object.values(metadata).some((value) => value !== undefined && value !== '') ? metadata : undefined
}

function getTargetSize(stage: HTMLElement | null, item: SectionLightboxItem | null): { width: number; height: number } {
  const rect = stage?.getBoundingClientRect()
  const dpr = typeof window === 'undefined' ? 1 : Math.min(2, Math.max(1, window.devicePixelRatio || 1))
  if (rect && rect.width > 0 && rect.height > 0) {
    return {
      width: Math.max(1, Math.round(rect.width * dpr)),
      height: Math.max(1, Math.round(rect.height * dpr)),
    }
  }
  const img = item?.element
  if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
    return { width: img.naturalWidth, height: img.naturalHeight }
  }
  return { width: 1280, height: 900 }
}

function createProcessToken(input: {
  src: string
  targetWidth: number
  targetHeight: number
  preset: EwaGalleryPresetId
  computeMode: EwaComputeMode
}): EwaProcessToken {
  return {
    id: Symbol('ewa-active-image'),
    src: input.src,
    targetWidth: input.targetWidth,
    targetHeight: input.targetHeight,
    preset: input.preset,
    computeMode: input.computeMode,
    startedAt: Date.now(),
  }
}

function isSameProcessToken(a: EwaProcessToken | null, b: EwaProcessToken | null): boolean {
  return Boolean(
    a &&
    b &&
    a.id === b.id &&
    a.src === b.src &&
    a.targetWidth === b.targetWidth &&
    a.targetHeight === b.targetHeight &&
    a.preset === b.preset &&
    a.computeMode === b.computeMode,
  )
}

export function useEwaGalleryProcessor(options: EwaGalleryProcessorOptions) {
  const state = ref<EwaGalleryStatus>('idle')
  const result = ref<EwaGalleryProcessResult | null>(null)
  const activeToken = ref<EwaProcessToken | null>(null)
  const processor = getSharedEwaGalleryProcessor()

  const outputUrl = computed(() => result.value?.ok ? result.value.outputUrl || '' : '')
  const diagnostics = computed(() => result.value?.diagnostics || null)
  const fallbackReason = computed(() => result.value?.fallbackReason || '')
  const isProcessing = computed(() => state.value === 'loading-source' || state.value === 'processing' || state.value === 'initializing')

  async function processActiveItem(item: SectionLightboxItem | null, preset?: EwaGalleryPresetId | string): Promise<void> {
    if (!item?.src) {
      clearRuntimeResult(false)
      return
    }

    const target = getTargetSize(options.stageRef.value, item)
    const media = getItemEwaMetadata(item)
    const { preset: presetConfig } = resolveEwaPresetFromAuthoring({
      metadata: media || (preset ? { ewaPreset: String(preset) } : undefined),
      src: item.src,
      alt: item.alt,
      caption: item.caption,
      title: item.title,
    })
    const resolvedPreset = presetConfig.id as EwaGalleryPresetId
    const resolvedComputeMode = resolveEwaComputeMode(presetConfig, media?.ewaMode)

    const token = createProcessToken({
      src: item.src,
      targetWidth: target.width,
      targetHeight: target.height,
      preset: resolvedPreset,
      computeMode: resolvedComputeMode,
    })
    activeToken.value = token
    result.value = null
    state.value = 'loading-source'

    try {
      state.value = 'processing'
      const next = await processor.processActiveImage({
        src: item.src,
        sourceWidth: item.element?.naturalWidth,
        sourceHeight: item.element?.naturalHeight,
        targetWidth: target.width,
        targetHeight: target.height,
        preset: resolvedPreset,
        alt: item.alt,
        caption: item.caption,
        title: item.title,
        media,
      })

      if (!isSameProcessToken(activeToken.value, token)) {
        result.value = {
          ok: false,
          src: item.src,
          width: target.width,
          height: target.height,
          preset: resolvedPreset,
          algorithmVersion: next.algorithmVersion,
          fallbackReason: 'stale-result',
          diagnostics: createFallbackEwaDiagnostics({
            preset: resolvedPreset,
            reason: 'stale-result',
            targetWidth: target.width,
            targetHeight: target.height,
          }),
        }
        return
      }
      result.value = next
      if (next.ok) state.value = 'ready'
      else if (next.fallbackReason === 'webgpu-unsupported') state.value = 'unsupported'
      else if (next.fallbackReason === 'processing-timeout') state.value = 'timeout'
      else state.value = 'fallback'
    } catch {
      if (!isSameProcessToken(activeToken.value, token)) return
      state.value = 'error'
      result.value = null
    }
  }

  function clearRuntimeResult(clearCache = false): void {
    activeToken.value = null
    result.value = null
    state.value = 'idle'
    if (clearCache) processor.clear()
  }

  onBeforeUnmount(() => clearRuntimeResult(true))

  return {
    state,
    result,
    outputUrl,
    diagnostics,
    fallbackReason,
    isProcessing,
    processActiveItem,
    clearRuntimeResult,
  }
}

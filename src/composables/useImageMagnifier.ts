import { createApp, reactive, type App } from 'vue'
import ImageMagnifierBox from '@/components/markdown/ImageMagnifierBox.vue'

export const STRICT_DOUBLE_CLICK_MS = 100

const DEFAULT_MAGNIFIER_SELECTOR = [
  '.vt-gallery-strip__thumb img',
  '.vt-mini-gallery__thumb img',
  '.vt-lightbox__thumb img',
].join(',')

type MagnifierState = {
  src: string
  alt: string
  visible: boolean
  x: number
  y: number
  zoom: number
}

export type ImageMagnifierOptions = {
  root: HTMLElement
  selector?: string
  thresholdMs?: number
  zoom?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function findMagnifierImage(target: EventTarget | null, selector: string): HTMLImageElement | null {
  if (!(target instanceof Element)) return null
  return target.closest(selector) as HTMLImageElement | null
}

function getPointerPercent(image: HTMLImageElement, event: PointerEvent | MouseEvent): { x: number; y: number } {
  const rect = image.getBoundingClientRect()

  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 50, y: 50 }
  }

  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
  }
}

function getImageKey(image: HTMLImageElement): string {
  return [
    image.currentSrc || image.src,
    image.closest('[data-gallery-group]')?.getAttribute('data-gallery-group') || '',
    image.closest('[data-vt-mini-gallery]')?.getAttribute('data-vt-mini-gallery') || '',
    image.closest('[data-thumb-index]')?.getAttribute('data-thumb-index') || '',
  ].join('::')
}

function isInsideRootOrLightbox(image: HTMLImageElement, root: HTMLElement): boolean {
  return root.contains(image) || Boolean(image.closest('.vt-lightbox'))
}

export function mountImageMagnifier(options: ImageMagnifierOptions): () => void {
  const selector = options.selector || DEFAULT_MAGNIFIER_SELECTOR
  const thresholdMs = options.thresholdMs ?? STRICT_DOUBLE_CLICK_MS
  const documentRef = options.root.ownerDocument || document
  const windowRef = documentRef.defaultView || window

  const state = reactive<MagnifierState>({
    src: '',
    alt: '',
    visible: false,
    x: 50,
    y: 50,
    zoom: options.zoom || 2.4,
  })

  const host = documentRef.createElement('div')
  host.dataset.vtImageMagnifierHost = '1'
  documentRef.body.appendChild(host)

  const app: App = createApp(ImageMagnifierBox, state)
  app.mount(host)

  const disabledImages = new Set<string>()
  let lastClickTargetKey = ''
  let lastClickAt = 0
  let clickTimer: number | null = null

  function hideMagnifier(): void {
    state.visible = false
  }

  function showMagnifier(image: HTMLImageElement, event: PointerEvent | MouseEvent): void {
    const { x, y } = getPointerPercent(image, event)
    state.src = image.currentSrc || image.src
    state.alt = image.alt || ''
    state.x = x
    state.y = y
    state.visible = true
  }

  function isMagnifierDisabled(image: HTMLImageElement): boolean {
    return disabledImages.has(getImageKey(image))
  }

  function disableMagnifier(image: HTMLImageElement): void {
    disabledImages.add(getImageKey(image))
  }

  function enableMagnifier(image: HTMLImageElement): void {
    disabledImages.delete(getImageKey(image))
  }

  function handlePointerMove(event: PointerEvent): void {
    const image = findMagnifierImage(event.target, selector)

    if (!image || !isInsideRootOrLightbox(image, options.root)) {
      hideMagnifier()
      return
    }

    if (isMagnifierDisabled(image)) {
      hideMagnifier()
      return
    }

    showMagnifier(image, event)
  }

  function handlePointerLeave(event: PointerEvent): void {
    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Element && findMagnifierImage(nextTarget, selector)) return
    hideMagnifier()
  }

  function handleClick(event: MouseEvent): void {
    const image = findMagnifierImage(event.target, selector)

    if (!image || !isInsideRootOrLightbox(image, options.root)) return

    const targetKey = getImageKey(image)
    const now = performance.now()
    const isStrictDoubleClick = targetKey === lastClickTargetKey && now - lastClickAt <= thresholdMs

    if (isStrictDoubleClick) {
      if (clickTimer !== null) {
        windowRef.clearTimeout(clickTimer)
        clickTimer = null
      }

      enableMagnifier(image)
      showMagnifier(image, event)
      lastClickTargetKey = ''
      lastClickAt = 0

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      return
    }

    lastClickTargetKey = targetKey
    lastClickAt = now

    if (clickTimer !== null) windowRef.clearTimeout(clickTimer)

    clickTimer = windowRef.setTimeout(() => {
      disableMagnifier(image)
      hideMagnifier()
      clickTimer = null
    }, thresholdMs)
  }

  documentRef.addEventListener('pointermove', handlePointerMove, true)
  documentRef.addEventListener('pointerleave', handlePointerLeave, true)
  documentRef.addEventListener('click', handleClick, true)

  return () => {
    documentRef.removeEventListener('pointermove', handlePointerMove, true)
    documentRef.removeEventListener('pointerleave', handlePointerLeave, true)
    documentRef.removeEventListener('click', handleClick, true)
    if (clickTimer !== null) {
      windowRef.clearTimeout(clickTimer)
      clickTimer = null
    }
    disabledImages.clear()
    app.unmount()
    host.remove()
  }
}

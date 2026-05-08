import { computed, createApp, onBeforeUnmount, ref, type App, type Ref } from 'vue'
import MiniGalleryStrip, { type MiniGalleryItem } from '@/components/markdown/MiniGalleryStrip.vue'
import type { GalleryStripItem } from '@/components/markdown/GalleryStrip.vue'

export type SectionLightboxItem = {
  src: string
  alt: string
  caption: string
  title?: string
  source: string
  thumbSrc: string
  meta?: Record<string, string>
  media?: {
    ewaPreset?: string
    ewaMode?: string
    pixelSafe?: boolean
    ewaEnabled?: boolean
    ewaNote?: string
  }
  element?: HTMLImageElement
  groupId: string
  index: number
}

export type SectionLightboxGroup = {
  id: string
  items: SectionLightboxItem[]
  hasManualGallery?: boolean
}

export type MountedMiniGallery = {
  groupId: string
  host: HTMLElement
  app: App
}

const LIGHTBOX_IMAGE_SELECTOR = 'img[data-vt-lightbox="1"]'

function createGroup(index: number): SectionLightboxGroup {
  return { id: `section-gallery-${index + 1}`, items: [], hasManualGallery: false }
}

function isSectionBoundary(element: Element): boolean {
  return Boolean(
    element.matches('hr') ||
      element.matches('section-gap') ||
      element.matches('.vt-section-gap') ||
      element.matches('.vt-markdown-section-gap') ||
      element.getAttribute('data-vt-section-gap') === '1',
  )
}

function isManualGalleryMarker(element: Element): boolean {
  return Boolean(
    element.matches('gallery-strip') ||
      element.matches('.vt-gallery-strip') ||
      element.getAttribute('data-vt-manual-gallery') === '1',
  )
}

function isLightboxImage(element: Element): element is HTMLImageElement {
  return element instanceof HTMLImageElement && element.matches(LIGHTBOX_IMAGE_SELECTOR)
}

function isExcludedImage(image: HTMLImageElement): boolean {
  return Boolean(
    image.closest('.vt-pagecard') ||
      image.closest('.vt-image-card') ||
      image.closest('.vt-video-player') ||
      image.closest('.vt-lightbox') ||
      image.closest('.vt-mini-gallery') ||
      image.closest('.vt-gallery-strip') ||
      image.closest('gallery-strip') ||
      image.closest('.vt-before-after') ||
      image.closest('[aria-hidden="true"]'),
  )
}

function clearGalleryDataset(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>('img[data-vt-gallery-group]').forEach((image) => {
    delete image.dataset.vtGalleryGroup
    delete image.dataset.vtGalleryIndex
  })
}

function createItem(image: HTMLImageElement, groupId: string, index: number): SectionLightboxItem {
  const src = image.currentSrc || image.src
  const caption = image.dataset.vtCaption || image.alt || ''
  image.dataset.vtGalleryGroup = groupId
  image.dataset.vtGalleryIndex = String(index)
  return {
    src,
    alt: image.alt || '',
    caption,
    title: image.dataset.vtTitle || caption || image.alt || '',
    source: image.dataset.vtSource || src,
    thumbSrc: image.dataset.vtThumb || src,
    element: image,
    groupId,
    index,
  }
}

export function collectSectionLightboxGroups(root: HTMLElement): SectionLightboxGroup[] {
  clearGalleryDataset(root)
  const groups: SectionLightboxGroup[] = []
  let current = createGroup(0)
  const pushCurrent = () => {
    if (!current.items.length) return
    groups.push(current)
    current = createGroup(groups.length)
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
  let node = walker.nextNode() as Element | null
  while (node) {
    if (isSectionBoundary(node)) pushCurrent()
    else if (isManualGalleryMarker(node)) current.hasManualGallery = true
    else if (isLightboxImage(node) && !isExcludedImage(node)) current.items.push(createItem(node, current.id, current.items.length))
    node = walker.nextNode() as Element | null
  }
  pushCurrent()
  return groups
}

function toMiniGalleryItems(group: SectionLightboxGroup): MiniGalleryItem[] {
  return group.items.map((item) => ({
    src: item.src,
    thumbSrc: item.thumbSrc,
    alt: item.alt,
    caption: item.caption,
    source: item.source,
  }))
}

export function parseGalleryHash(hash: string): { groupId: string; index: number } | null {
  const match = hash.match(/^#vt-gallery=([^:]+):(\d+)$/)
  if (!match) return null

  return {
    groupId: decodeURIComponent(match[1] || ''),
    index: Number(match[2] || 0),
  }
}

function collectManualGalleryGroup(root: HTMLElement, groupId: string): SectionLightboxGroup | null {
  const escapedGroupId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(groupId) : groupId.replace(/"/g, '\"')
  const gallery = root.querySelector<HTMLElement>(`.vt-gallery-strip[data-gallery-group="${escapedGroupId}"]`)
  if (!gallery) return null

  const buttons = Array.from(gallery.querySelectorAll<HTMLButtonElement>('.vt-gallery-strip__thumb:not(:disabled)'))
  const items = buttons
    .map((button, index): SectionLightboxItem | null => {
      const image = button.querySelector<HTMLImageElement>('img')
      if (!image) return null
      const src = image.currentSrc || image.src
      const caption = button.dataset.vtGalleryCaption || image.alt || ''
      const title = button.dataset.vtGalleryTitle || caption || image.alt || ''
      return {
        src,
        alt: image.alt || caption || '',
        title,
        caption,
        source: button.dataset.vtGallerySource || src,
        thumbSrc: src,
        groupId,
        index,
      }
    })
    .filter((item): item is SectionLightboxItem => item !== null)

  if (!items.length) return null
  return { id: groupId, items, hasManualGallery: true }
}

function findMiniGalleryAnchor(group: SectionLightboxGroup): HTMLElement | null {
  const lastItem = group.items[group.items.length - 1]
  if (!lastItem) return null

  const image = lastItem.element
  if (!image) return null
  return (
    image.closest<HTMLElement>('figure.vt-captioned-image') ||
    image.closest<HTMLElement>('.vt-captioned-image') ||
    image.closest<HTMLElement>('captioned-image') ||
    image.closest<HTMLElement>('figure') ||
    image.closest<HTMLElement>('p, div') ||
    image.parentElement ||
    image
  )
}

export type UseSectionLightboxOptions = {
  miniGallery?: boolean
}

export function useSectionLightbox(root: Ref<HTMLElement | null>) {
  const groups = ref<SectionLightboxGroup[]>([])
  const items = ref<SectionLightboxItem[]>([])
  const activeIndex = ref(-1)
  const activeGroupId = ref('')
  let mountedMiniGalleries: MountedMiniGallery[] = []
  let mountedRoot: HTMLElement | null = null

  const isOpen = computed(() => activeIndex.value >= 0 && items.value.length > 0)
  const activeItem = computed(() => (activeIndex.value < 0 ? null : items.value[activeIndex.value] || null))

  function collectItems(): void {
    const rootEl = root.value
    if (!rootEl) {
      groups.value = []
      items.value = []
      activeIndex.value = -1
      activeGroupId.value = ''
      return
    }
    groups.value = collectSectionLightboxGroups(rootEl)
  }

  function openGroup(group: SectionLightboxGroup, index: number): void {
    if (!group.items.length || index < 0 || index >= group.items.length) return
    items.value = group.items
    activeGroupId.value = group.id
    activeIndex.value = index
    document.body.classList.add('is-vt-lightbox-open')
  }

  function openGroupById(groupId: string, index: number): void {
    const group = groups.value.find((candidate) => candidate.id === groupId)
    if (!group) return
    openGroup(group, index)
  }

  function openManualGallery(groupId: string, manualItems: GalleryStripItem[], index: number): void {
    const resolvedItems = manualItems
      .filter((item) => item.srcFound !== false)
      .map((item, itemIndex) => ({
        src: item.src,
        alt: item.alt || item.caption || '',
        title: item.title || item.meta?.title || item.caption || item.alt || '',
        caption: item.caption || item.alt || '',
        source: item.source || item.src,
        meta: item.meta || {},
        media: (item as any).media,
        thumbSrc: item.thumbSrc || item.src,
        groupId,
        index: itemIndex,
      }))

    if (!resolvedItems.length) return
    const safeIndex = Math.min(Math.max(index, 0), resolvedItems.length - 1)
    items.value = resolvedItems
    activeGroupId.value = groupId
    activeIndex.value = safeIndex
    document.body.classList.add('is-vt-lightbox-open')
  }

  function openHashDeepLink(): void {
    const parsed = parseGalleryHash(window.location.hash || '')
    if (!parsed) return

    const group = groups.value.find((candidate) => candidate.id === parsed.groupId) || (root.value ? collectManualGalleryGroup(root.value, parsed.groupId) : null)
    if (group) {
      openGroup(group, parsed.index)
      return
    }
  }

  function close(): void {
    activeIndex.value = -1
    activeGroupId.value = ''
    items.value = []
    document.body.classList.remove('is-vt-lightbox-open')
  }

  function setIndex(index: number): void {
    if (!items.value.length || index < 0 || index >= items.value.length) return
    activeIndex.value = index
  }

  function previous(): void {
    if (!items.value.length) return
    activeIndex.value = activeIndex.value <= 0 ? items.value.length - 1 : activeIndex.value - 1
  }

  function next(): void {
    if (!items.value.length) return
    activeIndex.value = activeIndex.value >= items.value.length - 1 ? 0 : activeIndex.value + 1
  }

  function handleClick(event: MouseEvent): void {
    const target = event.target
    if (!(target instanceof Element)) return
    const image = target.closest(LIGHTBOX_IMAGE_SELECTOR) as HTMLImageElement | null
    if (!image || isExcludedImage(image)) return
    const groupId = image.dataset.vtGalleryGroup
    const index = Number(image.dataset.vtGalleryIndex || 0)
    if (!groupId || !Number.isFinite(index)) return
    const group = groups.value.find((candidate) => candidate.id === groupId)
    if (!group) return
    event.preventDefault()
    openGroup(group, index)
  }

  function handleManualGalleryOpen(event: Event): void {
    const detail = (event as CustomEvent<{ groupId?: string; index?: number; items?: GalleryStripItem[] }>).detail
    if (!detail?.groupId || !Array.isArray(detail.items)) return
    openManualGallery(detail.groupId, detail.items, Number(detail.index || 0))
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!isOpen.value) return
    if (event.key === 'Escape') { event.preventDefault(); close(); return }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); return }
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); return }
    if (event.key === 'Home') { event.preventDefault(); setIndex(0); return }
    if (event.key === 'End') { event.preventDefault(); setIndex(items.value.length - 1) }
  }

  function unmountMiniGalleries(): void {
    mountedMiniGalleries.forEach(({ app, host }) => {
      app.unmount()
      host.remove()
    })
    mountedMiniGalleries = []
  }

  function mountMiniGalleries(): void {
    const rootEl = root.value
    if (!rootEl) return

    unmountMiniGalleries()

    groups.value.forEach((group) => {
      if (group.items.length <= 1) return
      if (group.hasManualGallery) return
      if (rootEl.querySelector(`[data-vt-mini-gallery="${group.id}"]`)) return

      const anchor = findMiniGalleryAnchor(group)
      if (!anchor) return

      const host = document.createElement('div')
      host.dataset.vtMiniGallery = group.id
      host.className = 'vt-mini-gallery-host'
      anchor.insertAdjacentElement('afterend', host)

      const app = createApp(MiniGalleryStrip, {
        items: toMiniGalleryItems(group),
        groupId: group.id,
        onOpen: ({ groupId, index }: { groupId: string; index: number }) => openGroupById(groupId, index),
      })
      app.mount(host)
      mountedMiniGalleries.push({ groupId: group.id, host, app })
    })
  }

  function mount(options: UseSectionLightboxOptions = {}): void {
    unmount()
    collectItems()
    mountedRoot = root.value
    if (options.miniGallery !== false) mountMiniGalleries()
    window.setTimeout(openHashDeepLink, 0)
    mountedRoot?.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('vt:open-gallery', handleManualGalleryOpen as EventListener)
  }

  function unmount(): void {
    mountedRoot?.removeEventListener('click', handleClick)
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('vt:open-gallery', handleManualGalleryOpen as EventListener)
    mountedRoot = null
    unmountMiniGalleries()
    close()
  }

  onBeforeUnmount(unmount)
  return {
    groups,
    items,
    activeIndex,
    activeGroupId,
    activeItem,
    isOpen,
    collectItems,
    setIndex,
    close,
    previous,
    next,
    mount,
    unmount,
    mountMiniGalleries,
    unmountMiniGalleries,
  }
}

import { computed, onBeforeUnmount, ref, type Ref } from 'vue'

export type LightboxItem = {
  src: string
  alt: string
  caption: string
  index: number
}

export function useLightbox(root: Ref<HTMLElement | null>) {
  const items = ref<LightboxItem[]>([])
  const activeIndex = ref(-1)
  let mountedRoot: HTMLElement | null = null

  const isOpen = computed(() => activeIndex.value >= 0)
  const activeItem = computed(() => {
    if (activeIndex.value < 0) return null
    return items.value[activeIndex.value] || null
  })

  function collectItems(): void {
    const rootEl = root.value

    if (!rootEl) {
      items.value = []
      activeIndex.value = -1
      return
    }

    const images = Array.from(
      rootEl.querySelectorAll<HTMLImageElement>('img[data-vt-lightbox="1"]'),
    )

    items.value = images
      .map((image, index) => {
        image.dataset.vtLightboxIndex = String(index)

        return {
          src: image.currentSrc || image.src,
          alt: image.alt || '',
          caption: image.dataset.vtCaption || image.alt || '',
          index,
        }
      })
      .filter((item) => Boolean(item.src))
  }

  function open(index: number): void {
    if (!items.value.length) return
    if (index < 0 || index >= items.value.length) return

    activeIndex.value = index
    document.body.classList.add('is-vt-lightbox-open')
  }

  function close(): void {
    activeIndex.value = -1
    document.body.classList.remove('is-vt-lightbox-open')
  }

  function previous(): void {
    if (!items.value.length) return

    activeIndex.value =
      activeIndex.value <= 0 ? items.value.length - 1 : activeIndex.value - 1
  }

  function next(): void {
    if (!items.value.length) return

    activeIndex.value =
      activeIndex.value >= items.value.length - 1 ? 0 : activeIndex.value + 1
  }

  function handleClick(event: MouseEvent): void {
    const target = event.target

    if (!(target instanceof HTMLImageElement)) return
    if (target.dataset.vtLightbox !== '1') return

    const index = Number(target.dataset.vtLightboxIndex)
    if (!Number.isFinite(index)) return

    event.preventDefault()
    open(index)
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!isOpen.value) return

    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      previous()
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    }
  }

  function mount(): void {
    unmount()
    collectItems()

    mountedRoot = root.value
    mountedRoot?.addEventListener('click', handleClick)
    window.addEventListener('keydown', handleKeydown)
  }

  function unmount(): void {
    mountedRoot?.removeEventListener('click', handleClick)
    window.removeEventListener('keydown', handleKeydown)
    mountedRoot = null
    close()
  }

  onBeforeUnmount(unmount)

  return {
    items,
    activeIndex,
    activeItem,
    isOpen,
    collectItems,
    open,
    close,
    previous,
    next,
    mount,
    unmount,
  }
}

import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import {
  isBrowserHandledRouteHref,
  prefetchRouteTarget,
} from '@/router/routePrefetch'

interface ViewportInternalLinkPrefetchOptions {
  limit?: number
  rootMargin?: string
}

function scheduleIdle(callback: () => void): number {
  const idle = (globalThis as typeof globalThis & {
    requestIdleCallback?: (handler: () => void, options?: { timeout?: number }) => number
  }).requestIdleCallback

  if (idle) return idle(callback, { timeout: 900 })
  return window.setTimeout(callback, 0)
}

export function useViewportInternalLinkPrefetch(
  containerRef: Ref<HTMLElement | null>,
  options: ViewportInternalLinkPrefetchOptions = {},
): { refreshViewportInternalLinkPrefetch: () => void } {
  const warmedHrefs = new Set<string>()
  let observer: IntersectionObserver | null = null
  let mounted = false

  const limit = options.limit ?? 12
  const rootMargin = options.rootMargin ?? '160px 0px'

  function warmHref(href: string): void {
    const normalizedHref = String(href || '').trim()
    if (!normalizedHref) return
    if (isBrowserHandledRouteHref(normalizedHref)) return
    if (warmedHrefs.has(normalizedHref)) return

    warmedHrefs.add(normalizedHref)
    scheduleIdle(() => {
      void prefetchRouteTarget(normalizedHref)
    })
  }

  function disconnectObserver(): void {
    if (!observer) return
    observer.disconnect()
    observer = null
  }

  function refreshViewportInternalLinkPrefetch(): void {
    if (!mounted) return

    disconnectObserver()

    const container = containerRef.value
    if (!container) return

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .filter((link) => !isBrowserHandledRouteHref(link.getAttribute('href') || ''))
      .slice(0, limit)

    if (!links.length) return

    if (typeof IntersectionObserver === 'undefined') {
      for (const link of links) warmHref(link.getAttribute('href') || '')
      return
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const link = entry.target as HTMLAnchorElement
          warmHref(link.getAttribute('href') || '')
          observer?.unobserve(link)
        }
      },
      { rootMargin },
    )

    for (const link of links) observer.observe(link)
  }

  onMounted(() => {
    mounted = true
    void nextTick(refreshViewportInternalLinkPrefetch)
  })

  watch(containerRef, () => {
    void nextTick(refreshViewportInternalLinkPrefetch)
  })

  onBeforeUnmount(() => {
    mounted = false
    disconnectObserver()
  })

  return {
    refreshViewportInternalLinkPrefetch,
  }
}

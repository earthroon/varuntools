import { router } from './index'
import { markdownNavigationPrefetch } from '@/markdown/markdownNavigationPrefetch'

const pendingRoutePrefetches = new Map<string, Promise<void>>()
const warmedRouteTargets = new Set<string>()

const externalHrefPattern = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

export function normalizeRoutePrefetchHref(href: string): string {
  const normalizedHref = String(href || '').trim()
  if (!normalizedHref) return ''
  return normalizedHref
}

export function isBrowserHandledRouteHref(href: string): boolean {
  const normalizedHref = normalizeRoutePrefetchHref(href)
  if (!normalizedHref) return true
  if (normalizedHref === '#' || normalizedHref.startsWith('#')) return true
  if (externalHrefPattern.test(normalizedHref)) return true
  return false
}

function readMatchedComponents(href: string): unknown[] {
  try {
    const resolved = router.resolve(href)
    return resolved.matched.flatMap((record) => {
      const components = record.components || {}
      return Object.values(components)
    })
  } catch {
    return []
  }
}

function prefetchRouteComponent(component: unknown): Promise<unknown> | null {
  if (typeof component !== 'function') return null

  try {
    const loaded = (component as () => unknown)()
    if (loaded && typeof (loaded as Promise<unknown>).then === 'function') {
      return loaded as Promise<unknown>
    }
  } catch {
    return null
  }

  return null
}

export function prefetchRouteTarget(href: string): Promise<void> {
  const normalizedHref = normalizeRoutePrefetchHref(href)
  if (isBrowserHandledRouteHref(normalizedHref)) return Promise.resolve()

  const pending = pendingRoutePrefetches.get(normalizedHref)
  if (pending) return pending

  const prefetch = Promise.resolve()
    .then(async () => {
      warmedRouteTargets.add(normalizedHref)
      const routeComponentLoads = readMatchedComponents(normalizedHref)
        .map((component) => prefetchRouteComponent(component))
        .filter((load): load is Promise<unknown> => Boolean(load))

      await Promise.allSettled([
        ...routeComponentLoads,
        markdownNavigationPrefetch(normalizedHref) || Promise.resolve(null),
      ])
    })
    .catch(() => undefined)
    .finally(() => {
      pendingRoutePrefetches.delete(normalizedHref)
    })

  pendingRoutePrefetches.set(normalizedHref, prefetch)
  return prefetch
}

export function readRoutePrefetchStats(): { pending: number; warmed: number } {
  return {
    pending: pendingRoutePrefetches.size,
    warmed: warmedRouteTargets.size,
  }
}

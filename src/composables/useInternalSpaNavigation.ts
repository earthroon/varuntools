import { useRouter } from 'vue-router'
import {
  isBrowserHandledRouteHref,
  prefetchRouteTarget,
} from '@/router/routePrefetch'

export function shouldPreserveBrowserNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented) return true
  if (event.button !== 0) return true
  return event.metaKey || event.altKey || event.ctrlKey || event.shiftKey
}

export function useInternalSpaNavigation() {
  const router = useRouter()

  function warmInternalHref(href: string): void {
    void prefetchRouteTarget(href)
  }

  function navigateInternalHref(event: MouseEvent, href: string): void {
    warmInternalHref(href)

    if (isBrowserHandledRouteHref(href)) return
    if (shouldPreserveBrowserNavigation(event)) return

    event.preventDefault()
    void router.push(href)
  }

  return {
    warmInternalHref,
    navigateInternalHref,
  }
}

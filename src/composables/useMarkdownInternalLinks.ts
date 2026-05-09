import { onBeforeUnmount, watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'

const FILE_ASSET_RE = /\.(?:avif|bmp|csv|gif|jpe?g|json|md|mov|mp3|mp4|pdf|png|svg|tar|txt|webm|webp|zip)(?:$|[?#])/i
const EXTERNAL_PROTOCOL_RE = /^(?:https?:|mailto:|tel:|sms:|blob:|data:|file:|javascript:)/i

function normalizedBasePath(): string {
  const base = import.meta.env.BASE_URL || '/'
  if (!base || base === '/') return '/'
  return `/${base.replace(/^\/+/, '').replace(/\/+$/, '')}/`
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

function findAnchor(target: EventTarget | null, root: HTMLElement): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null
  const anchor = target.closest('a[href]') as HTMLAnchorElement | null
  if (!anchor || !root.contains(anchor)) return null
  return anchor
}

function normalizeRouteHref(rawHref: string): string {
  const href = rawHref.trim()
  if (!href || href.startsWith('#')) return ''
  if (href.startsWith('//')) return ''
  if (EXTERNAL_PROTOCOL_RE.test(href)) return ''
  if (FILE_ASSET_RE.test(href)) return ''

  let url: URL
  try {
    url = new URL(href, window.location.href)
  } catch {
    return ''
  }

  if (url.origin !== window.location.origin) return ''
  if (FILE_ASSET_RE.test(url.pathname)) return ''

  const base = normalizedBasePath()
  let path = url.pathname

  if (base !== '/' && path.startsWith(base)) {
    path = `/${path.slice(base.length).replace(/^\/+/, '')}`
  }

  if (!path.startsWith('/')) path = `/${path}`

  return `${path}${url.search}${url.hash}`
}

export function useMarkdownInternalLinks(root: Ref<HTMLElement | null>): void {
  const router = useRouter()
  let cleanup: (() => void) | null = null

  watch(
    root,
    (element) => {
      cleanup?.()
      cleanup = null
      if (!element) return

      const onClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || isModifiedClick(event)) return

        const anchor = findAnchor(event.target, element)
        if (!anchor) return
        if (anchor.hasAttribute('download')) return
        if (anchor.target && anchor.target !== '_self') return

        const routeHref = normalizeRouteHref(anchor.getAttribute('href') || '')
        if (!routeHref) return

        event.preventDefault()
        router.push(routeHref)
      }

      element.addEventListener('click', onClick)
      cleanup = () => element.removeEventListener('click', onClick)
    },
    { immediate: true, flush: 'post' },
  )

  onBeforeUnmount(() => {
    cleanup?.()
    cleanup = null
  })
}

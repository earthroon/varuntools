import { prefetchMarkdownPageBySlug } from './lazyMarkdownPageLoader'

const STATIC_MARKDOWN_PREFETCH_SKIP_SLUGS = new Set([
  '',
  'works',
  'index',
  'search',
  '404',
])

const externalHrefPattern = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i
const externalProtocolPattern = /^(?:https?:|mailto:|tel:)/i

export function markdownNavigationHrefToSlug(href: string): string {
  const normalizedHref = String(href || '').trim()
  if (!normalizedHref) return ''
  if (normalizedHref === '#' || normalizedHref.startsWith('#')) return ''
  if (externalHrefPattern.test(normalizedHref)) return ''
  if (externalProtocolPattern.test(normalizedHref)) return ''

  const withoutQuery = normalizedHref.split('?')[0] || ''
  const withoutHash = withoutQuery.split('#')[0] || ''
  const slug = withoutHash.replace(/^\/+|\/+$/g, '').replace(/\/+/, '/')

  if (STATIC_MARKDOWN_PREFETCH_SKIP_SLUGS.has(slug)) return ''
  return slug
}

export function markdownNavigationPrefetch(href: string): Promise<unknown> | null {
  const slug = markdownNavigationHrefToSlug(href)
  if (!slug) return null
  return prefetchMarkdownPageBySlug(slug)
}


export function warmMarkdownNavigationTarget(href: string): Promise<unknown> | null {
  return markdownNavigationPrefetch(href)
}


export function prewarmMarkdownNavigationHrefs(hrefs: string[], limit = 8): void {
  const warmed = new Set<string>()

  for (const href of hrefs) {
    const slug = markdownNavigationHrefToSlug(href)
    if (!slug || warmed.has(slug)) continue

    warmed.add(slug)
    void prefetchMarkdownPageBySlug(slug)

    if (warmed.size >= limit) return
  }
}

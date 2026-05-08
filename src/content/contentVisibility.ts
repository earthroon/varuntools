export type ContentVisibilitySurface =
  | 'navigation'
  | 'sitemap'
  | 'search'
  | 'public-link'

export type ContentVisibilityDecision = {
  include: boolean
  reason: string
}

export type ContentPageInventoryItem = {
  source: string
  routePath: string
  slug?: string
  title?: string
  description?: string
  kind?: string
  status?: string
  visibility?: 'public' | 'hidden' | 'private' | 'draft' | string
  featured?: boolean
  order?: number
  robots?: string | string[] | null
  noindex?: boolean
  section?: string
  tags?: string[]
}

export function isInternalPreviewPage(page: Pick<ContentPageInventoryItem, 'source' | 'routePath' | 'slug'>): boolean {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return haystack.includes('editorial-showcase') || haystack.includes('visual-qa')
}

export function isDummyOrPlaygroundPage(page: Pick<ContentPageInventoryItem, 'source' | 'routePath' | 'slug'>): boolean {
  const haystack = `${page.source || ''} ${page.routePath || ''} ${page.slug || ''}`.toLowerCase()
  return /dummy|playground|spec/.test(haystack)
}

export function isActivePublicPage(page: ContentPageInventoryItem): boolean {
  if (page.visibility && page.visibility !== 'public') return false
  if (page.status && page.status !== 'active') return false
  return true
}

export function shouldIncludeInSitemap(page: ContentPageInventoryItem): boolean {
  if (!isActivePublicPage(page)) return false
  if (page.noindex) return false
  if (page.section === 'checkout') return false
  if (page.section === 'qa') return false
  if (isInternalPreviewPage(page)) return false
  if (isDummyOrPlaygroundPage(page)) return false
  return true
}

export function shouldIncludeInSearchIndex(page: ContentPageInventoryItem): boolean {
  if (!shouldIncludeInSitemap(page)) return false
  if (page.section === 'policies') return false
  if (page.section === 'claim') return false
  if (page.section === 'inquiry') return false
  return true
}

export function getContentVisibilityDecision(
  page: ContentPageInventoryItem,
  surface: ContentVisibilitySurface,
): ContentVisibilityDecision {
  if (surface === 'sitemap') {
    return shouldIncludeInSitemap(page)
      ? { include: true, reason: 'public-active-indexable-page' }
      : { include: false, reason: 'not-eligible-for-sitemap' }
  }

  if (surface === 'search') {
    return shouldIncludeInSearchIndex(page)
      ? { include: true, reason: 'public-active-searchable-page' }
      : { include: false, reason: 'not-eligible-for-search-index' }
  }

  if (surface === 'navigation') {
    return isActivePublicPage(page) && !page.noindex
      ? { include: true, reason: 'public-active-navigation-candidate' }
      : { include: false, reason: 'not-eligible-for-navigation' }
  }

  return isActivePublicPage(page)
    ? { include: true, reason: 'public-link-candidate' }
    : { include: false, reason: 'not-eligible-for-public-link' }
}

import { shouldIncludeInSitemap, type ContentPageInventoryItem } from '../content/contentVisibility'

export type SitemapCandidate = {
  href: string
  source: string
  section?: string
  title?: string
}

export function getSitemapCandidates(pages: ContentPageInventoryItem[]): SitemapCandidate[] {
  return pages
    .filter(shouldIncludeInSitemap)
    .map((page) => ({
      href: page.routePath,
      source: page.source,
      section: page.section,
      title: page.title,
    }))
}

import { shouldIncludeInSearchIndex, type ContentPageInventoryItem } from '../content/contentVisibility'

export type SearchIndexCandidate = {
  href: string
  source: string
  section?: string
  title?: string
  description?: string
}

export function getSearchIndexCandidates(pages: ContentPageInventoryItem[]): SearchIndexCandidate[] {
  return pages
    .filter(shouldIncludeInSearchIndex)
    .map((page) => ({
      href: page.routePath,
      source: page.source,
      section: page.section,
      title: page.title,
      description: page.description,
    }))
}

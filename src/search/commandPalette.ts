import type { SearchIndexDocument, SearchIndexEntry } from './searchIndex'

export type CommandPaletteResult = SearchIndexEntry & {
  score: number
  matchedText: string
}

export function normalizeSearchQuery(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getSearchEntryHaystack(entry: SearchIndexEntry): string {
  return normalizeSearchQuery([
    entry.title,
    entry.description,
    entry.kind,
    entry.status,
    entry.slug,
    entry.tags.join(' '),
    entry.product?.type || '',
    entry.product?.status || '',
    entry.product?.category || '',
    entry.product?.subcategory || '',
    entry.product?.series || '',
    entry.product?.collection || '',
  ].filter(Boolean).join(' '))
}

export function getSearchEntryLabel(entry: SearchIndexEntry): string {
  const kind = entry.kind || 'page'
  const productStatus = entry.product?.status ? ` · ${entry.product.status}` : ''
  return `${kind}${productStatus}`
}

export function searchCommandPaletteEntries(
  entries: SearchIndexEntry[],
  query: string,
  limit = 8,
): CommandPaletteResult[] {
  const normalizedQuery = normalizeSearchQuery(query)
  const terms = normalizedQuery.split(' ').filter(Boolean)

  const ranked = entries
    .map((entry) => {
      const title = normalizeSearchQuery(entry.title)
      const description = normalizeSearchQuery(entry.description)
      const slug = normalizeSearchQuery(entry.slug)
      const tags = normalizeSearchQuery(entry.tags.join(' '))
      const haystack = getSearchEntryHaystack(entry)

      let score = 0
      if (!terms.length) {
        score = (entry.featured ? 20 : 0) + Math.max(0, 10000 - entry.order) / 1000
      } else {
        for (const term of terms) {
          if (title === term) score += 90
          if (title.startsWith(term)) score += 70
          if (title.includes(term)) score += 50
          if (tags.includes(term)) score += 36
          if (slug.includes(term)) score += 28
          if (description.includes(term)) score += 18
          if (haystack.includes(term)) score += 8
        }
      }

      return {
        ...entry,
        score,
        matchedText: haystack,
      }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order || a.title.localeCompare(b.title))

  return ranked.slice(0, limit)
}

export function isSearchIndexDocument(value: unknown): value is SearchIndexDocument {
  const payload = value as Partial<SearchIndexDocument>
  return payload?.version === 1 && Array.isArray(payload.entries)
}

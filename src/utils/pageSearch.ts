export type PageSearchEntryType = 'page' | 'work' | 'doc' | 'product'

export type PageSearchEntry = {
  slug: string
  href: string
  title: string
  description: string
  type: PageSearchEntryType
  section?: string
  tags: string[]
  keywords: string[]
  text: string
  status?: string
  indexable: boolean
  sourcePath: string
}

export type PageSearchResult = PageSearchEntry & {
  score: number
  matchedFields: string[]
}

const TYPE_PRIORITY: Record<PageSearchEntryType, number> = {
  work: 4,
  doc: 3,
  product: 2,
  page: 1,
}

export function normalizePageSearchText(value: unknown): string {
  if (Array.isArray(value)) return normalizePageSearchText(value.join(' '))
  if (value === null || value === undefined) return ''
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function fieldText(value: unknown): string {
  return normalizePageSearchText(value)
}

function includesField(value: unknown, query: string): boolean {
  return Boolean(query && fieldText(value).includes(query))
}

export function scorePageSearchEntry(
  entry: PageSearchEntry,
  query: string,
): PageSearchResult | null {
  const normalizedQuery = normalizePageSearchText(query)
  if (!normalizedQuery) return null

  let score = 0
  const matchedFields = new Set<string>()

  if (includesField(entry.title, normalizedQuery)) {
    score += 50
    matchedFields.add('title')
  }
  if (includesField(entry.slug, normalizedQuery) || includesField(entry.href, normalizedQuery)) {
    score += 30
    matchedFields.add('slug')
  }
  if (entry.tags.some((tag) => includesField(tag, normalizedQuery))) {
    score += 25
    matchedFields.add('tags')
  }
  if (entry.keywords.some((keyword) => includesField(keyword, normalizedQuery))) {
    score += 25
    matchedFields.add('keywords')
  }
  if (includesField(entry.description, normalizedQuery)) {
    score += 15
    matchedFields.add('description')
  }
  if (includesField(entry.text, normalizedQuery)) {
    score += 5
    matchedFields.add('text')
  }

  if (score <= 0) return null

  return {
    ...entry,
    score,
    matchedFields: Array.from(matchedFields),
  }
}

export function searchPages(entries: PageSearchEntry[], query: string): PageSearchResult[] {
  return entries
    .filter((entry) => entry.indexable !== false)
    .map((entry) => scorePageSearchEntry(entry, query))
    .filter((entry): entry is PageSearchResult => Boolean(entry))
    .sort((a, b) => b.score - a.score || (TYPE_PRIORITY[b.type] || 0) - (TYPE_PRIORITY[a.type] || 0) || a.title.localeCompare(b.title))
}

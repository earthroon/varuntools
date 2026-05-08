import type { WorkCardEntry } from '@/markdown/pageRegistry'

export type PortfolioFacetField = 'type' | 'tags' | 'stack' | 'role' | 'year'

export type PortfolioFacetItem = {
  value: string
  count: number
}

export type PortfolioSearchState = {
  query?: string
  selectedType?: string
  selectedTag?: string
  selectedStack?: string
  selectedRole?: string
  selectedYear?: string
  featuredOnly?: boolean
}

export function normalizeSearchText(value: unknown): string {
  if (Array.isArray(value)) return normalizeSearchText(value.join(' '))
  if (value === null || value === undefined) return ''
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function workEntryToSearchText(entry: WorkCardEntry): string {
  return [
    entry.title,
    entry.description,
    entry.summary,
    entry.type,
    entry.kind,
    entry.slug,
    entry.status,
    entry.workStatus,
    entry.year,
    entry.period,
    entry.client,
    entry.category,
    entry.series,
    ...entry.role,
    ...entry.stack,
    ...entry.tools,
    ...entry.tags,
  ]
    .map(normalizeSearchText)
    .filter(Boolean)
    .join(' ')
}

export function matchesPortfolioQuery(entry: WorkCardEntry, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true
  return workEntryToSearchText(entry).includes(normalizedQuery)
}

function valuesForField(entry: WorkCardEntry, field: PortfolioFacetField): string[] {
  if (field === 'type') return [entry.type || entry.kind].filter(Boolean)
  if (field === 'tags') return entry.tags
  if (field === 'stack') return entry.stack
  if (field === 'role') return entry.role
  if (field === 'year') return entry.year ? [String(entry.year)] : []
  return []
}

export function buildFacetIndex(entries: WorkCardEntry[], field: PortfolioFacetField): PortfolioFacetItem[] {
  const counts = new Map<string, number>()

  for (const entry of entries) {
    for (const value of valuesForField(entry, field)) {
      const label = String(value || '').trim()
      if (!label) continue
      counts.set(label, (counts.get(label) || 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export function filterPortfolioEntries(
  entries: WorkCardEntry[],
  state: PortfolioSearchState,
): WorkCardEntry[] {
  const selectedType = state.selectedType || ''
  const selectedTag = state.selectedTag || ''
  const selectedStack = state.selectedStack || ''
  const selectedRole = state.selectedRole || ''
  const selectedYear = state.selectedYear || ''

  return entries.filter((entry) => {
    if (state.featuredOnly && !entry.featured) return false
    if (selectedType && entry.type !== selectedType && entry.kind !== selectedType) return false
    if (selectedTag && !entry.tags.includes(selectedTag)) return false
    if (selectedStack && !entry.stack.includes(selectedStack)) return false
    if (selectedRole && !entry.role.includes(selectedRole)) return false
    if (selectedYear && String(entry.year || '') !== selectedYear) return false
    return matchesPortfolioQuery(entry, state.query || '')
  })
}

import type { WorkCardEntry } from '@/markdown/pageRegistry'
import type { WorkFilterState, WorkTaxonomyRecord } from '@/types/workTaxonomy'

export const defaultWorkFilterState: WorkFilterState = {
  category: 'all',
  role: 'all',
  stack: 'all',
  tag: 'all',
  featuredOnly: false,
}

function normalizeToken(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim().toLowerCase()
}

function normalizeTokens(values: unknown[]): string[] {
  return Array.from(new Set(values.map(normalizeToken).filter(Boolean)))
}

function includesToken(values: string[], selected?: string): boolean {
  const token = normalizeToken(selected)
  if (!token || token === 'all') return true
  return values.map(normalizeToken).includes(token)
}

export function getWorkTaxonomyRecord(work: WorkCardEntry): WorkTaxonomyRecord {
  const categories = normalizeTokens([work.category, work.type, work.kind, ...work.tags]) as WorkTaxonomyRecord['categories']
  const roles = normalizeTokens(work.role) as WorkTaxonomyRecord['roles']
  const stack = normalizeTokens(work.stack) as WorkTaxonomyRecord['stack']
  const tags = normalizeTokens(work.tags)

  return {
    categories,
    roles,
    stack,
    tags,
    featured: work.featured,
  }
}

export function isFilterableWork(work: WorkCardEntry): boolean {
  if (work.visibility === 'hidden' || work.visibility === 'private' || work.visibility === 'draft') return false
  if (work.status === 'draft' || work.status === 'archived' || work.status === 'disabled') return false
  if (work.workStatus === 'draft' || work.workStatus === 'private') return false
  if (work.slug.includes('editorial-showcase')) return false
  if (work.slug.includes('dummy') || work.slug.includes('playground') || work.slug.includes('spec')) return false
  return true
}

export function filterWorks(
  works: WorkCardEntry[],
  filters: WorkFilterState = defaultWorkFilterState,
): WorkCardEntry[] {
  return works.filter((work) => {
    if (!isFilterableWork(work)) return false
    const taxonomy = getWorkTaxonomyRecord(work)
    if (filters.featuredOnly && !taxonomy.featured) return false
    if (!includesToken(taxonomy.categories, filters.category)) return false
    if (!includesToken(taxonomy.roles, filters.role)) return false
    if (!includesToken(taxonomy.stack, filters.stack)) return false
    if (!includesToken(taxonomy.tags, filters.tag)) return false
    return true
  })
}

export function parseWorkFilterQuery(query: Record<string, unknown>): WorkFilterState {
  const featured = query.featured
  return {
    category: normalizeToken(query.category || query.type) || 'all',
    role: normalizeToken(query.role) || 'all',
    stack: normalizeToken(query.stack) || 'all',
    tag: normalizeToken(query.tag) || 'all',
    featuredOnly: featured === true || featured === '1' || featured === 'true',
  }
}

export function hasActiveWorkFilters(filters: WorkFilterState): boolean {
  return Boolean(
    (filters.category && filters.category !== 'all') ||
      (filters.role && filters.role !== 'all') ||
      (filters.stack && filters.stack !== 'all') ||
      (filters.tag && filters.tag !== 'all') ||
      filters.featuredOnly,
  )
}

import type { LoadedMarkdownPage } from './types'
import { getCollectionKey, resolveContentKind, resolvePublicExposure } from '@/content/exposureTaxonomy'
import { getAdjacentWorks } from '@/utils/getAdjacentWorks'

export type WorkType =
  | 'case-study'
  | 'tool'
  | 'visual'
  | 'service'
  | 'experiment'
  | 'store'
  | 'system'
  | string

export type WorkStatus = 'draft' | 'published' | 'archived' | 'private' | string

export type WorkMood = {
  tone?: string
  density?: string
  color?: string
}

export type WorkLinks = {
  demo?: string
  repo?: string
  caseStudy?: string
}

export type WorkCardEntry = {
  slug: string
  href: string
  title: string
  description: string
  summary: string
  cover: string
  thumbnail: string
  icon: string
  kind: string
  type: WorkType
  status: string
  workStatus: WorkStatus
  tags: string[]
  order: number
  featured: boolean
  weight: number
  contentDir: string

  year?: number
  period: string
  client: string
  role: string[]
  stack: string[]
  tools: string[]
  category: string
  mood: WorkMood
  links: WorkLinks
  hasWorkMetadata: boolean

  date: string
  updated: string
  series: string
  related: string[]
  visibility: string
}

export type WorkCollectionFilter = {
  query?: string
  kind?: string
  type?: string
  role?: string
  stack?: string
  tag?: string
  year?: string
  featuredOnly?: boolean
  status?: string
  includeDrafts?: boolean
}

export type WorkCollectionSort = 'order' | 'featured' | 'year' | 'title' | 'kind' | 'type'

export type WorkFilterOptions = {
  kinds: string[]
  types: string[]
  roles: string[]
  stacks: string[]
  tags: string[]
  years: string[]
}

export type WorkDetailContext = {
  current: WorkCardEntry
  related: WorkCardEntry[]
  previous: WorkCardEntry | null
  next: WorkCardEntry | null
}

const INDEX_EXCLUDED_SLUGS = new Set(['works'])
const INDEX_ALLOWED_KINDS = new Set(['work', 'tool', 'lab', 'doc', 'post', 'case-study', 'page'])
const WORK_DETAIL_ALLOWED_KINDS = new Set(['work', 'case-study'])
const WORK_DETAIL_ALLOWED_CATEGORIES = new Set(['works', 'work', 'case-study'])
const HIDDEN_WORK_STATUSES = new Set(['draft', 'private'])

function readRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') return true
    if (normalized === 'false') return false
  }
  return fallback
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function readStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => readString(item)).filter(Boolean)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.includes('|')) {
      return trimmed.split('|').map((item) => item.trim()).filter(Boolean)
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean)
    }
    return [trimmed]
  }

  return []
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}

function extractYear(value: unknown): number | undefined {
  const direct = readNumber(value)
  if (direct) return direct

  const text = readString(value)
  const match = text.match(/(?:19|20)\d{2}/)
  if (!match) return undefined

  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

function getWorkObject(frontmatter: LoadedMarkdownPage['frontmatter']): Record<string, unknown> {
  return readRecord((frontmatter as any).work)
}

function getWorkMood(work: Record<string, unknown>): WorkMood {
  const mood = readRecord(work.mood)
  return {
    tone: readString(mood.tone),
    density: readString(mood.density),
    color: readString(mood.color),
  }
}

function getWorkLinks(work: Record<string, unknown>): WorkLinks {
  const links = readRecord(work.links)
  return {
    demo: readString(links.demo),
    repo: readString(links.repo),
    caseStudy: readString(links.caseStudy),
  }
}

function hasWorkMetadata(work: Record<string, unknown>): boolean {
  return Object.keys(work).length > 0
}

function normalizeWorkStatus(pageStatus: string, workStatus: string): WorkStatus {
  if (workStatus) return workStatus
  if (pageStatus === 'draft') return 'draft'
  if (pageStatus === 'archived') return 'archived'
  return 'published'
}

function isCollectionVisible(entry: WorkCardEntry, includeDrafts = false): boolean {
  if (entry.visibility === 'hidden') return false
  if (entry.workStatus === 'private') return false
  if (!includeDrafts && entry.workStatus === 'draft') return false
  if (!includeDrafts && entry.status === 'draft') return false
  return true
}

function isDetailEligible(entry: WorkCardEntry): boolean {
  return (
    !INDEX_EXCLUDED_SLUGS.has(entry.slug) &&
    isCollectionVisible(entry) &&
    (INDEX_ALLOWED_KINDS.has(entry.kind) || entry.featured || entry.hasWorkMetadata)
  )
}

export function toWorkCardEntry(page: LoadedMarkdownPage): WorkCardEntry {
  const frontmatter = page.frontmatter
  const work = getWorkObject(frontmatter)
  const pageStatus = frontmatter.status || 'active'
  const workStatus = normalizeWorkStatus(pageStatus, readString(work.status))
  const publicKind = resolveContentKind(page)
  const exposure = resolvePublicExposure(page)
  const collectionKey = getCollectionKey(page)
  const type = readString(work.type) || publicKind || 'page'
  const role = uniqueStrings(readStringArray(work.role).concat(readStringArray(frontmatter.role)))
  const stack = uniqueStrings(readStringArray(work.stack))
  const tools = uniqueStrings(readStringArray(work.tools))
  const tags = uniqueStrings(readStringArray(work.tags).concat(readStringArray(frontmatter.tags)))
  const period = readString(work.period)
  const year = extractYear(work.year) ?? extractYear(period) ?? extractYear(frontmatter.date)
  const summary =
    readString(work.summary) ||
    frontmatter.cardDescription ||
    frontmatter.summary ||
    frontmatter.description ||
    ''
  const cover = frontmatter.cardCover || frontmatter.thumbnail || frontmatter.cover || ''

  return {
    slug: page.slug,
    href: `/${page.slug}`,
    title: frontmatter.cardTitle || frontmatter.title,
    description: summary,
    summary,
    cover,
    thumbnail: frontmatter.thumbnail || cover,
    icon: frontmatter.cardIcon || '',
    kind: publicKind,
    type,
    status: pageStatus,
    workStatus,
    tags,
    order: typeof frontmatter.order === 'number' ? frontmatter.order : 9999,
    featured: readBoolean(work.featured, exposure.featured || frontmatter.featured === true),
    weight: readNumber(work.weight) ?? 0,
    contentDir: page.contentDir,

    year,
    period,
    client: readString(work.client) || readString(frontmatter.client),
    role,
    stack,
    tools,
    category: readString(work.category) || collectionKey,
    mood: getWorkMood(work),
    links: getWorkLinks(work),
    hasWorkMetadata: hasWorkMetadata(work),

    date: frontmatter.date || '',
    updated: frontmatter.updated || '',
    series: frontmatter.series || '',
    related: frontmatter.related || [],
    visibility: frontmatter.visibility || 'public',
  }
}

export function getFeaturedWorkEntries(
  pages: LoadedMarkdownPage[],
): WorkCardEntry[] {
  return sortWorkEntries(
    pages
      .map(toWorkCardEntry)
      .filter((entry) => entry.featured)
      .filter((entry) => entry.category === 'works')
      .filter((entry) => isCollectionVisible(entry)),
    'featured',
  )
}

export function getWorkCollectionEntries(
  pages: LoadedMarkdownPage[],
  options: { includeDrafts?: boolean } = {},
): WorkCardEntry[] {
  return sortWorkEntries(
    pages
      .map(toWorkCardEntry)
      .filter((entry) => !INDEX_EXCLUDED_SLUGS.has(entry.slug))
      .filter((entry) => isCollectionVisible(entry, options.includeDrafts))
      .filter((entry) => entry.category === 'works')
      .filter(
        (entry) => INDEX_ALLOWED_KINDS.has(entry.kind) || entry.featured || entry.hasWorkMetadata,
      ),
    'featured',
  )
}

export function filterWorkEntries(
  entries: WorkCardEntry[],
  filter: WorkCollectionFilter,
): WorkCardEntry[] {
  const query = (filter.query || '').trim().toLowerCase()
  const typeFilter = filter.type || filter.kind || ''

  return entries.filter((entry) => {
    if (typeFilter && entry.type !== typeFilter && entry.kind !== typeFilter) return false
    if (filter.status && entry.workStatus !== filter.status && entry.status !== filter.status) return false
    if (filter.role && !entry.role.includes(filter.role)) return false
    if (filter.stack && !entry.stack.includes(filter.stack)) return false
    if (filter.tag && !entry.tags.includes(filter.tag)) return false
    if (filter.year && String(entry.year || '') !== filter.year) return false
    if (filter.featuredOnly && !entry.featured) return false
    if (!filter.includeDrafts && HIDDEN_WORK_STATUSES.has(entry.workStatus)) return false

    if (query) {
      const haystack = [
        entry.title,
        entry.description,
        entry.summary,
        entry.kind,
        entry.type,
        entry.status,
        entry.workStatus,
        entry.series,
        entry.period,
        entry.client,
        entry.category,
        ...entry.role,
        ...entry.stack,
        ...entry.tools,
        ...entry.tags,
      ]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query)) return false
    }

    return true
  })
}

function compareDefault(a: WorkCardEntry, b: WorkCardEntry): number {
  return (
    Number(b.featured) - Number(a.featured) ||
    b.weight - a.weight ||
    Number(b.year ?? 0) - Number(a.year ?? 0) ||
    a.order - b.order ||
    a.title.localeCompare(b.title)
  )
}

export function sortWorkEntries(
  entries: WorkCardEntry[],
  sort: WorkCollectionSort,
): WorkCardEntry[] {
  const copy = [...entries]

  if (sort === 'title') {
    return copy.sort((a, b) => a.title.localeCompare(b.title))
  }

  if (sort === 'kind' || sort === 'type') {
    return copy.sort(
      (a, b) =>
        a.type.localeCompare(b.type) ||
        b.weight - a.weight ||
        a.order - b.order ||
        a.title.localeCompare(b.title),
    )
  }

  if (sort === 'year') {
    return copy.sort(
      (a, b) =>
        Number(b.year ?? 0) - Number(a.year ?? 0) ||
        b.weight - a.weight ||
        a.title.localeCompare(b.title),
    )
  }

  return copy.sort(compareDefault)
}

function sortByFrequency(values: string[]): string[] {
  const counts = new Map<string, number>()
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value]) => value)
}

export function getAvailableKinds(entries: WorkCardEntry[]): string[] {
  return getAvailableTypes(entries)
}

export function getAvailableTypes(entries: WorkCardEntry[]): string[] {
  return sortByFrequency(entries.map((entry) => entry.type || entry.kind))
}

export function getAvailableRoles(entries: WorkCardEntry[]): string[] {
  return sortByFrequency(entries.flatMap((entry) => entry.role))
}

export function getAvailableStacks(entries: WorkCardEntry[]): string[] {
  return sortByFrequency(entries.flatMap((entry) => entry.stack))
}

export function getAvailableTags(entries: WorkCardEntry[]): string[] {
  return sortByFrequency(entries.flatMap((entry) => entry.tags))
}

export function getAvailableYears(entries: WorkCardEntry[]): string[] {
  return sortByFrequency(entries.map((entry) => String(entry.year || '')).filter(Boolean))
}

export function buildWorkFilterOptions(entries: WorkCardEntry[]): WorkFilterOptions {
  return {
    kinds: getAvailableKinds(entries),
    types: getAvailableTypes(entries),
    roles: getAvailableRoles(entries),
    stacks: getAvailableStacks(entries),
    tags: getAvailableTags(entries),
    years: getAvailableYears(entries),
  }
}


function isWorkDetailEligible(entry: WorkCardEntry): boolean {
  return (
    isDetailEligible(entry) &&
    (
      WORK_DETAIL_ALLOWED_KINDS.has(entry.kind) ||
      WORK_DETAIL_ALLOWED_KINDS.has(entry.type) ||
      WORK_DETAIL_ALLOWED_CATEGORIES.has(entry.category) ||
      entry.slug.startsWith('works/')
    )
  )
}

export function getVisibleWorkEntries(
  pages: LoadedMarkdownPage[],
): WorkCardEntry[] {
  return sortWorkEntries(
    pages
      .map(toWorkCardEntry)
      .filter(isWorkDetailEligible),
    'featured',
  )
}

export function getRelatedWorkEntries(
  current: WorkCardEntry,
  entries: WorkCardEntry[],
  limit = 4,
): WorkCardEntry[] {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]))
  const related: WorkCardEntry[] = []
  const seen = new Set<string>([current.slug])

  for (const slug of current.related) {
    const entry = bySlug.get(slug)
    if (!entry || seen.has(entry.slug)) continue

    related.push(entry)
    seen.add(entry.slug)

    if (related.length >= limit) return related
  }

  const candidates = entries
    .filter((entry) => !seen.has(entry.slug))
    .map((entry) => {
      let score = 0

      if (current.series && entry.series === current.series) score += 12
      if (entry.type === current.type) score += 4
      if (entry.kind === current.kind) score += 3

      const sharedTags = entry.tags.filter((tag) => current.tags.includes(tag))
      score += sharedTags.length * 4

      const sharedStack = entry.stack.filter((item) => current.stack.includes(item))
      score += sharedStack.length * 2

      const orderDistance = Math.abs(entry.order - current.order)
      score -= Math.min(orderDistance, 20) * 0.05

      return { entry, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || compareDefault(a.entry, b.entry))

  for (const item of candidates) {
    related.push(item.entry)
    seen.add(item.entry.slug)

    if (related.length >= limit) break
  }

  return related
}

export function getAdjacentWorkEntries(
  current: WorkCardEntry,
  entries: WorkCardEntry[],
): {
  previous: WorkCardEntry | null
  next: WorkCardEntry | null
} {
  const sorted = [...entries].sort(
    (a, b) =>
      a.order - b.order ||
      Number(b.year ?? 0) - Number(a.year ?? 0) ||
      a.title.localeCompare(b.title),
  )
  const index = sorted.findIndex((entry) => entry.slug === current.slug)

  if (index < 0) {
    return { previous: null, next: null }
  }

  return {
    previous: sorted[index - 1] || null,
    next: sorted[index + 1] || null,
  }
}

export function getWorkDetailContext(
  pages: LoadedMarkdownPage[],
  slug: string,
): WorkDetailContext | null {
  const entries = getVisibleWorkEntries(pages)
  const normalizedSlug = normalizeRelatedWorkSlug(slug)
  const bySlug = getWorkEntryBySlug(entries)

  const current =
    entries.find((entry) => entry.slug === slug) ||
    entries.find((entry) => normalizeRelatedWorkSlug(entry.slug) === normalizedSlug) ||
    bySlug.get(normalizedSlug) ||
    bySlug.get(`works/${normalizedSlug}`) ||
    (normalizedSlug.startsWith('works/') ? bySlug.get(normalizedSlug.slice('works/'.length)) : null) ||
    null

  if (!current) return null

  const related = getRelatedWorkEntries(current, entries, 4)
  const adjacent = getAdjacentWorkEntries(current, entries)

  return {
    current,
    related,
    previous: adjacent.previous,
    next: adjacent.next,
  }
}

export function normalizeRelatedWorkSlug(value: string): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw
  let slug = raw.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
  return slug.replace(/\/+$/, '')
}

export function getWorkEntryBySlug(entries: WorkCardEntry[]): Map<string, WorkCardEntry> {
  const map = new Map<string, WorkCardEntry>()

  for (const entry of entries) {
    const slug = normalizeRelatedWorkSlug(entry.slug)
    if (!slug) continue

    map.set(slug, entry)

    if (slug.startsWith('works/')) {
      map.set(slug.slice('works/'.length), entry)
    } else {
      map.set(`works/${slug}`, entry)
    }
  }

  return map
}

export function resolveRelatedWorkEntries(
  entries: WorkCardEntry[],
  items: string[],
  options: { currentSlug?: string; limit?: number } = {},
): WorkCardEntry[] {
  const bySlug = getWorkEntryBySlug(entries)
  const currentSlug = normalizeRelatedWorkSlug(options.currentSlug || '')
  const limit = Number.isFinite(Number(options.limit)) ? Math.max(0, Number(options.limit)) : Infinity
  const resolved: WorkCardEntry[] = []
  const seen = new Set<string>()

  function markSeen(slug: string): void {
    const normalized = normalizeRelatedWorkSlug(slug)
    if (!normalized) return
    seen.add(normalized)
    if (normalized.startsWith('works/')) {
      seen.add(normalized.slice('works/'.length))
    } else {
      seen.add(`works/${normalized}`)
    }
  }

  markSeen(currentSlug)

  for (const item of items) {
    const slug = normalizeRelatedWorkSlug(item)
    if (!slug || seen.has(slug) || /^[a-z][a-z0-9+.-]*:/i.test(slug)) continue
    const entry = bySlug.get(slug)
    if (!entry || seen.has(entry.slug)) continue
    if (entry.workStatus === 'private' || entry.workStatus === 'draft') continue
    if (entry.status === 'draft' || entry.visibility === 'hidden') continue
    resolved.push(entry)
    markSeen(entry.slug)
    if (resolved.length >= limit) break
  }

  return resolved
}

import { computed } from 'vue'
import homeCollectionsFile from '@/content/generated/homeCollections.generated.json'
import type { RuntimePublicContentIndexEntry } from '@/composables/useRuntimePublicContentIndex'

export type HomeCollectionWorkMeta = {
  hasWorkMetadata: boolean
  status: string
  role: string[]
  stack: string[]
  period: string
  type: string
}

export type HomeCollectionEntry = {
  slug: string
  href: string
  contentDir: string
  title: string
  description: string
  category: string
  categoryLabel: string
  kind: string
  collection: string
  tags: string[]
  order: number
  featured: boolean
  visibility: string
  status: string
  cover: string
  thumbnail: string
  year?: number
  time?: number
  work: HomeCollectionWorkMeta
}

type HomeCollectionsFile = {
  schemaVersion?: string
  generatedAt?: string
  entries?: unknown[]
}

const RECENT_CATEGORIES = new Set(['post', 'work', 'case-study', 'lab', 'tool', 'doc'])
const HIDDEN_STATUSES = new Set(['draft', 'archived', 'trashed', 'private'])

const typedHomeCollectionsFile = homeCollectionsFile as HomeCollectionsFile

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase()
    return text === 'true' || text === '1' || text === 'yes'
  }
  return false
}

function readNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readOptionalNumber(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function readTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeHref(slug: string, href: string): string {
  if (href) return href
  return slug === 'home' ? '/' : `/${slug}`
}

export function normalizeHomeCollectionEntry(raw: unknown): HomeCollectionEntry | null {
  const source = readObject(raw)
  const slug = readString(source.slug)
  if (!slug) return null

  const work = readObject(source.work)
  const category = readString(source.category) || 'page'
  const kind = readString(source.kind) || category
  const collection = readString(source.collection) || kind
  const cover = readString(source.cover)
  const workStatus = readString(work.status) || readString(source.workStatus) || readString(source.status) || 'active'

  return {
    slug,
    href: normalizeHref(slug, readString(source.href)),
    contentDir: readString(source.contentDir) || slug,
    title: readString(source.title) || slug,
    description: readString(source.description),
    category,
    categoryLabel: readString(source.categoryLabel) || category,
    kind,
    collection,
    tags: readTags(source.tags),
    order: readNumber(source.order, 9999),
    featured: readBoolean(source.featured),
    visibility: readString(source.visibility) || 'public',
    status: readString(source.status) || 'active',
    cover,
    thumbnail: readString(source.thumbnail) || cover,
    year: readOptionalNumber(source.year),
    time: readOptionalNumber(source.time),
    work: {
      hasWorkMetadata: readBoolean(work.hasWorkMetadata) || readBoolean(source.hasWorkMetadata),
      status: workStatus,
      role: readTags(work.role ?? source.role),
      stack: readTags(work.stack ?? source.stack),
      period: readString(work.period ?? source.period),
      type: readString(work.type ?? source.type) || kind,
    },
  }
}

export function normalizeRuntimeHomeCollectionEntry(raw: RuntimePublicContentIndexEntry): HomeCollectionEntry | null {
  return normalizeHomeCollectionEntry({
    ...raw,
    categoryLabel: raw.categoryLabel || raw.category,
    work: {
      hasWorkMetadata: raw.category === 'work' || raw.category === 'case-study' || raw.kind === 'work' || raw.kind === 'case-study',
      status: raw.status || 'active',
      role: [],
      stack: [],
      period: '',
      type: raw.kind || raw.category,
    },
  })
}

function isPublicEntry(entry: HomeCollectionEntry): boolean {
  if (entry.visibility !== 'public') return false
  return !HIDDEN_STATUSES.has(entry.status)
}

function readComparableTime(entry: HomeCollectionEntry): number {
  if (typeof entry.time === 'number' && Number.isFinite(entry.time) && entry.time > 0) return entry.time
  if (typeof entry.year === 'number' && Number.isFinite(entry.year)) {
    const fallback = Date.parse(`${entry.year}-01-01`)
    if (Number.isFinite(fallback)) return fallback
  }
  return 0
}

function compareRecent(a: HomeCollectionEntry, b: HomeCollectionEntry): number {
  return (
    readComparableTime(b) - readComparableTime(a) ||
    Number(b.featured) - Number(a.featured) ||
    a.order - b.order ||
    a.title.localeCompare(b.title)
  )
}

function compareFeatured(a: HomeCollectionEntry, b: HomeCollectionEntry): number {
  return a.order - b.order || readComparableTime(b) - readComparableTime(a) || a.title.localeCompare(b.title)
}

const generatedEntries = computed(() => {
  if (typedHomeCollectionsFile.schemaVersion !== 'home-collections.v1') return []
  return (typedHomeCollectionsFile.entries || [])
    .map((entry) => normalizeHomeCollectionEntry(entry))
    .filter((entry): entry is HomeCollectionEntry => Boolean(entry))
})

export function useHomeCollections() {
  const entries = computed(() => generatedEntries.value)

  const recentEntries = computed(() => entries.value
    .filter(isPublicEntry)
    .filter((entry) => RECENT_CATEGORIES.has(entry.category))
    .sort(compareRecent))

  const featuredWorks = computed(() => entries.value
    .filter(isPublicEntry)
    .filter((entry) => entry.featured)
    .filter((entry) => entry.work.hasWorkMetadata || entry.category === 'work' || entry.category === 'case-study' || entry.kind === 'work' || entry.kind === 'case-study')
    .filter((entry) => entry.work.status !== 'private' && entry.work.status !== 'draft')
    .sort(compareFeatured))

  return {
    entries,
    recentEntries,
    featuredWorks,
  }
}

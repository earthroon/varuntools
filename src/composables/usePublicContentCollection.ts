import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { resolveContentCategory, resolveContentKind, resolvePublicExposure } from '@/content/exposureTaxonomy'
import { getPublicContentCategoryLabel } from '@/content/publicContentCategoryLabels'
import { normalizeSearchText } from '@/utils/portfolioSearch'
import taxonomy from '../../config/public-content-taxonomy.json'

export type PublicContentCardEntry = {
  slug: string
  href: string
  title: string
  description: string
  category: string
  kind: string
  collection: string
  tags: string[]
  order: number
  featured: boolean
  cover: string
  thumbnail: string
  contentDir: string
  status: string
  visibility: string
  year?: number
}

export type PublicContentSort = 'featured' | 'title' | 'category' | 'order'

const typedTaxonomy = taxonomy as {
  publicIndexCategories: string[]
  primaryPublicIndexCategories?: string[]
  workRouteCategories: string[]
  collectionIndexSlugs: string[]
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true'
  return false
}

function readSort(value: unknown): PublicContentSort {
  if (value === 'title' || value === 'category' || value === 'order') return value
  return 'featured'
}

function normalizeSlug(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

function hrefOf(page: LoadedMarkdownPage): string {
  return page.slug === 'home' ? '/' : '/' + page.slug
}

function tagsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : []
}

function extractYear(value: unknown): number | undefined {
  const text = String(value || '')
  const match = text.match(/(?:19|20)\d{2}/)
  if (!match) return undefined
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : undefined
}

function pageToEntry(page: LoadedMarkdownPage): PublicContentCardEntry {
  const fm = page.frontmatter
  const exposure = resolvePublicExposure(page)
  const category = resolveContentCategory(page)
  const kind = resolveContentKind(page)
  const collection = exposure.collection && exposure.collection !== 'none' ? exposure.collection : kind
  const title = fm.cardTitle || fm.title || page.slug
  const description = fm.cardDescription || fm.summary || fm.description || ''
  const cover = fm.cardCover || fm.thumbnail || fm.cover || fm.ogImage || ''
  return {
    slug: page.slug,
    href: hrefOf(page),
    title,
    description,
    category,
    kind,
    collection,
    tags: tagsOf(fm.tags),
    order: typeof fm.order === 'number' ? fm.order : 9999,
    featured: fm.featured === true || exposure.featured === true,
    cover,
    thumbnail: fm.thumbnail || cover,
    contentDir: page.contentDir,
    status: exposure.status || fm.status || 'active',
    visibility: exposure.visibility || fm.visibility || 'public',
    year: extractYear(fm.date || (fm as Record<string, unknown>).publishedDate || fm.updated || page.slug),
  }
}

function entryToSearchText(entry: PublicContentCardEntry): string {
  return [
    entry.title,
    entry.description,
    entry.category,
    entry.kind,
    entry.collection,
    entry.slug,
    entry.status,
    String(entry.year || ''),
    ...entry.tags,
  ].map(normalizeSearchText).filter(Boolean).join(' ')
}

function buildValueOptions(entries: PublicContentCardEntry[], field: 'tags' | 'year') {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    const values = field === 'tags' ? entry.tags : (entry.year ? [String(entry.year)] : [])
    for (const value of values) {
      const key = String(value || '').trim()
      if (!key) continue
      counts.set(key, (counts.get(key) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

function sortEntries(entries: PublicContentCardEntry[], sort: string): PublicContentCardEntry[] {
  const copy = [...entries]
  if (sort === 'title') return copy.sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'category') return copy.sort((a, b) => a.category.localeCompare(b.category) || a.order - b.order || a.title.localeCompare(b.title))
  if (sort === 'order') return copy.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  return copy.sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order || a.title.localeCompare(b.title))
}

export function usePublicContentCollection(
  pages: LoadedMarkdownPage[],
  options: { scope: 'index' | 'works' } = { scope: 'index' },
) {
  const route = useRoute()
  const router = useRouter()

  const query = ref(readString(route.query.q))
  const category = ref(readString(route.query.category || route.query.type))
  const tag = ref(readString(route.query.tag))
  const year = ref(readString(route.query.year))
  const featuredOnly = ref(readBoolean(route.query.featured))
  const sort = ref<string>(readSort(route.query.sort))

  const allowedCategories = computed(() => (
    options.scope === 'works'
      ? typedTaxonomy.workRouteCategories
      : typedTaxonomy.publicIndexCategories
  ))
  const indexSlugs = computed(() => new Set((typedTaxonomy.collectionIndexSlugs || []).map(normalizeSlug)))

  const allEntries = computed(() => {
    const allowed = new Set(allowedCategories.value)
    return sortEntries(
      pages
        .map(pageToEntry)
        .filter((entry) => !indexSlugs.value.has(normalizeSlug(entry.slug)))
        .filter((entry) => allowed.has(entry.category))
        .filter((entry) => entry.visibility === 'public')
        .filter((entry) => entry.status !== 'draft' && entry.status !== 'archived' && entry.status !== 'trashed')
        .filter((entry) => entry.href !== '/'),
      'featured',
    )
  })

  const categoryOptions = computed(() => allowedCategories.value.map((value) => ({
    value,
    label: getPublicContentCategoryLabel(value),
    count: allEntries.value.filter((entry) => entry.category === value).length,
  })))
  const tagOptions = computed(() => buildValueOptions(allEntries.value, 'tags'))
  const yearOptions = computed(() => buildValueOptions(allEntries.value, 'year'))

  const filteredEntries = computed(() => {
    const normalizedQuery = normalizeSearchText(query.value)
    return sortEntries(allEntries.value.filter((entry) => {
      if (category.value && category.value !== 'all' && entry.category !== category.value) return false
      if (tag.value && !entry.tags.includes(tag.value)) return false
      if (year.value && String(entry.year || '') !== year.value) return false
      if (featuredOnly.value && !entry.featured) return false
      if (normalizedQuery && !entryToSearchText(entry).includes(normalizedQuery)) return false
      return true
    }), sort.value)
  })

  function resetFilters() {
    query.value = ''
    category.value = ''
    tag.value = ''
    year.value = ''
    featuredOnly.value = false
    sort.value = 'featured'
  }

  watch(
    () => route.query,
    (nextQuery) => {
      const nextSearch = readString(nextQuery.q)
      const nextCategory = readString(nextQuery.category || nextQuery.type)
      const nextTag = readString(nextQuery.tag)
      const nextYear = readString(nextQuery.year)
      const nextFeatured = readBoolean(nextQuery.featured)
      const nextSort = readSort(nextQuery.sort)
      if (query.value !== nextSearch) query.value = nextSearch
      if (category.value !== nextCategory) category.value = nextCategory
      if (tag.value !== nextTag) tag.value = nextTag
      if (year.value !== nextYear) year.value = nextYear
      if (featuredOnly.value !== nextFeatured) featuredOnly.value = nextFeatured
      if (sort.value !== nextSort) sort.value = nextSort
    },
  )

  watch(
    [query, category, tag, year, featuredOnly, sort],
    () => {
      const nextQuery = {
        ...(query.value ? { q: query.value } : {}),
        ...(category.value ? { category: category.value } : {}),
        ...(tag.value ? { tag: tag.value } : {}),
        ...(year.value ? { year: year.value } : {}),
        ...(featuredOnly.value ? { featured: '1' } : {}),
        ...(sort.value !== 'featured' ? { sort: sort.value } : {}),
      }
      router.replace({ query: nextQuery })
    },
    { flush: 'post' },
  )

  return {
    query,
    category,
    tag,
    year,
    featuredOnly,
    sort,
    allEntries,
    filteredEntries,
    categoryOptions,
    tagOptions,
    yearOptions,
    resetFilters,
  }
}


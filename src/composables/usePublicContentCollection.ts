import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LoadedMarkdownPage } from '@/markdown/types'
import {
  sortWorkEntries,
  toWorkCardEntry,
  type WorkCardEntry,
  type WorkCollectionSort,
} from '@/markdown/pageRegistry'
import { buildFacetIndex, filterPortfolioEntries } from '@/utils/portfolioSearch'
import { filterWorks } from '@/utils/workFilters'
import { loadGeneratedPages } from '@/lib/generated-content/loadGeneratedPages'
import { getGeneratedWorkCardEntries } from '@/lib/generated-content/generatedWorkEntries'
import { resolvePublicExposure } from '@/content/exposureTaxonomy'
import {
  isPublicIndexCategory,
  isWorkRouteCategory,
  normalizePublicCategory,
} from '@/content/publicContentTaxonomy'

export type PublicContentCollectionScope = 'index' | 'works'

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true'
  return false
}

function readSort(value: unknown): WorkCollectionSort {
  if (value === 'title' || value === 'kind' || value === 'type' || value === 'year' || value === 'featured' || value === 'order') return value
  return 'featured'
}

function allowedForScope(category: string, scope: PublicContentCollectionScope): boolean {
  if (scope === 'works') return isWorkRouteCategory(category)
  return isPublicIndexCategory(category)
}

function scopedEntryFromMarkdown(page: LoadedMarkdownPage, scope: PublicContentCollectionScope): WorkCardEntry | null {
  const exposure = resolvePublicExposure(page)
  const category = normalizePublicCategory(exposure.category)
  if (exposure.visibility !== 'public') return null
  if (!exposure.route) return null
  if (!allowedForScope(category, scope)) return null

  const entry = toWorkCardEntry(page)
  return {
    ...entry,
    kind: exposure.kind,
    type: category,
    category,
    workStatus: entry.workStatus || 'published',
    hasWorkMetadata: entry.hasWorkMetadata || category === 'work' || category === 'case-study',
  }
}

function scopedGeneratedEntries(scope: PublicContentCollectionScope): WorkCardEntry[] {
  return getGeneratedWorkCardEntries(loadGeneratedPages())
    .map((entry) => {
      const category = normalizePublicCategory(entry.category || entry.type || entry.kind)
      return { ...entry, category, type: category }
    })
    .filter((entry) => allowedForScope(entry.category, scope))
}

export function usePublicContentCollection(
  pages: LoadedMarkdownPage[],
  options: { scope: PublicContentCollectionScope },
) {
  const route = useRoute()
  const router = useRouter()
  const scope = options.scope

  const query = ref(readString(route.query.q))
  const kind = ref(readString(route.query.category || route.query.type || route.query.kind))
  const role = ref(readString(route.query.role))
  const stack = ref(readString(route.query.stack))
  const tag = ref(readString(route.query.tag))
  const year = ref(readString(route.query.year))
  const featuredOnly = ref(readBoolean(route.query.featured))
  const sort = ref<WorkCollectionSort>(readSort(route.query.sort))

  const allEntries = computed(() => sortWorkEntries([
    ...pages
      .map((page) => scopedEntryFromMarkdown(page, scope))
      .filter((entry): entry is WorkCardEntry => Boolean(entry)),
    ...scopedGeneratedEntries(scope),
  ], 'featured'))

  const typeOptions = computed(() => buildFacetIndex(allEntries.value, 'type'))
  const roleOptions = computed(() => buildFacetIndex(allEntries.value, 'role'))
  const stackOptions = computed(() => buildFacetIndex(allEntries.value, 'stack'))
  const tagOptions = computed(() => buildFacetIndex(allEntries.value, 'tags'))
  const yearOptions = computed(() => buildFacetIndex(allEntries.value, 'year'))

  const filteredEntries = computed(() => {
    const taxonomyFiltered = filterWorks(allEntries.value, {
      category: kind.value || 'all',
      role: role.value || 'all',
      stack: stack.value || 'all',
      tag: tag.value || 'all',
      featuredOnly: featuredOnly.value,
    })

    const filtered = filterPortfolioEntries(taxonomyFiltered, {
      query: query.value,
      selectedType: kind.value,
      selectedRole: role.value,
      selectedStack: stack.value,
      selectedTag: tag.value,
      selectedYear: year.value,
      featuredOnly: featuredOnly.value,
    })

    return sortWorkEntries(filtered, sort.value)
  })

  function resetFilters() {
    query.value = ''
    kind.value = ''
    role.value = ''
    stack.value = ''
    tag.value = ''
    year.value = ''
    featuredOnly.value = false
    sort.value = 'featured'
  }

  watch(
    () => route.query,
    (nextQuery) => {
      const nextSearch = readString(nextQuery.q)
      const nextKind = readString(nextQuery.category || nextQuery.type || nextQuery.kind)
      const nextRole = readString(nextQuery.role)
      const nextStack = readString(nextQuery.stack)
      const nextTag = readString(nextQuery.tag)
      const nextYear = readString(nextQuery.year)
      const nextFeatured = readBoolean(nextQuery.featured)
      const nextSort = readSort(nextQuery.sort)

      if (query.value !== nextSearch) query.value = nextSearch
      if (kind.value !== nextKind) kind.value = nextKind
      if (role.value !== nextRole) role.value = nextRole
      if (stack.value !== nextStack) stack.value = nextStack
      if (tag.value !== nextTag) tag.value = nextTag
      if (year.value !== nextYear) year.value = nextYear
      if (featuredOnly.value !== nextFeatured) featuredOnly.value = nextFeatured
      if (sort.value !== nextSort) sort.value = nextSort
    },
  )

  watch(
    [query, kind, role, stack, tag, year, featuredOnly, sort],
    () => {
      const nextQuery = {
        ...(query.value ? { q: query.value } : {}),
        ...(kind.value ? { category: kind.value } : {}),
        ...(role.value ? { role: role.value } : {}),
        ...(stack.value ? { stack: stack.value } : {}),
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
    kind,
    role,
    stack,
    tag,
    year,
    featuredOnly,
    sort,
    allEntries,
    filteredEntries,
    typeOptions,
    roleOptions,
    stackOptions,
    tagOptions,
    yearOptions,
    resetFilters,
  }
}

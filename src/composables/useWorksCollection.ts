import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { LoadedMarkdownPage } from '@/markdown/types'
import {
  getWorkCollectionEntries,
  sortWorkEntries,
  type WorkCollectionSort,
} from '@/markdown/pageRegistry'
import { buildFacetIndex, filterPortfolioEntries } from '@/utils/portfolioSearch'
import { filterWorks } from '@/utils/workFilters'
import { loadGeneratedPages } from '@/lib/generated-content/loadGeneratedPages'
import { getGeneratedWorkCardEntries } from '@/lib/generated-content/generatedWorkEntries'

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true'
  return false
}

function readSort(value: unknown): WorkCollectionSort {
  if (
    value === 'title' ||
    value === 'kind' ||
    value === 'type' ||
    value === 'year' ||
    value === 'featured' ||
    value === 'order'
  ) {
    return value
  }
  return 'featured'
}

export function useWorksCollection(pages: LoadedMarkdownPage[]) {
  const route = useRoute()
  const router = useRouter()

  const query = ref(readString(route.query.q))
  const kind = ref(readString(route.query.type || route.query.kind))
  const role = ref(readString(route.query.role))
  const stack = ref(readString(route.query.stack))
  const tag = ref(readString(route.query.tag))
  const year = ref(readString(route.query.year))
  const featuredOnly = ref(readBoolean(route.query.featured))
  const sort = ref<WorkCollectionSort>(readSort(route.query.sort))

  const generatedEntries = computed(() => getGeneratedWorkCardEntries(loadGeneratedPages()))
  const allEntries = computed(() => sortWorkEntries([
    ...getWorkCollectionEntries(pages),
    ...generatedEntries.value,
  ], 'featured'))
  const typeOptions = computed(() => buildFacetIndex(allEntries.value, 'type'))
  const roleOptions = computed(() => buildFacetIndex(allEntries.value, 'role'))
  const stackOptions = computed(() => buildFacetIndex(allEntries.value, 'stack'))
  const tagOptions = computed(() => buildFacetIndex(allEntries.value, 'tags'))
  const yearOptions = computed(() => buildFacetIndex(allEntries.value, 'year'))

  const kinds = computed(() => typeOptions.value.map((item) => item.value))
  const roles = computed(() => roleOptions.value.map((item) => item.value))
  const stacks = computed(() => stackOptions.value.map((item) => item.value))
  const tags = computed(() => tagOptions.value.map((item) => item.value))
  const years = computed(() => yearOptions.value.map((item) => item.value))

  const filterOptions = computed(() => ({
    kinds: kinds.value,
    types: kinds.value,
    roles: roles.value,
    stacks: stacks.value,
    tags: tags.value,
    years: years.value,
  }))

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
      const nextKind = readString(nextQuery.type || nextQuery.kind)
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
        ...(kind.value ? { type: kind.value } : {}),
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
    kinds,
    roles,
    stacks,
    tags,
    years,
    typeOptions,
    roleOptions,
    stackOptions,
    tagOptions,
    yearOptions,
    filterOptions,
    resetFilters,
  }
}

import { computed, ref, watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import pageSearchIndex from '@/content/generated/page-search-index.json'
import { searchPages, type PageSearchEntry } from '@/utils/pageSearch'

export function usePageSearch() {
  const route = useRoute()
  const router = useRouter()
  const query = ref(String(route.query.q || ''))
  const entries = ref((pageSearchIndex.pages || []) as PageSearchEntry[])

  const hasQuery = computed(() => query.value.trim().length > 0)
  const results = computed(() => searchPages(entries.value, query.value))
  const resultCount = computed(() => results.value.length)

  let syncingFromRoute = false

  watch(
    () => route.query.q,
    (value) => {
      syncingFromRoute = true
      query.value = String(value || '')
      syncingFromRoute = false
    },
  )

  watch(query, (value) => {
    if (syncingFromRoute) return
    const nextQuery = value.trim()
    router.replace({
      path: '/search',
      query: nextQuery ? { q: nextQuery } : {},
    })
  })

  function resetSearch(): void {
    query.value = ''
  }

  return {
    query,
    entries,
    hasQuery,
    results,
    resultCount,
    resetSearch,
  }
}

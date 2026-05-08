import { computed, ref, type Ref } from 'vue'
import type { WorkCardEntry } from '@/markdown/pageRegistry'
import {
  buildFacetIndex,
  filterPortfolioEntries,
  type PortfolioSearchState,
} from '@/utils/portfolioSearch'

export function usePortfolioSearch(entries: Ref<WorkCardEntry[]>) {
  const query = ref('')
  const selectedType = ref('')
  const selectedTag = ref('')
  const selectedStack = ref('')
  const selectedRole = ref('')
  const selectedYear = ref('')
  const featuredOnly = ref(false)

  const typeOptions = computed(() => buildFacetIndex(entries.value, 'type'))
  const tagOptions = computed(() => buildFacetIndex(entries.value, 'tags'))
  const stackOptions = computed(() => buildFacetIndex(entries.value, 'stack'))
  const roleOptions = computed(() => buildFacetIndex(entries.value, 'role'))
  const yearOptions = computed(() => buildFacetIndex(entries.value, 'year'))

  const state = computed<PortfolioSearchState>(() => ({
    query: query.value,
    selectedType: selectedType.value,
    selectedTag: selectedTag.value,
    selectedStack: selectedStack.value,
    selectedRole: selectedRole.value,
    selectedYear: selectedYear.value,
    featuredOnly: featuredOnly.value,
  }))

  const filteredEntries = computed(() => filterPortfolioEntries(entries.value, state.value))
  const resultCount = computed(() => filteredEntries.value.length)

  function resetSearch() {
    query.value = ''
    selectedType.value = ''
    selectedTag.value = ''
    selectedStack.value = ''
    selectedRole.value = ''
    selectedYear.value = ''
    featuredOnly.value = false
  }

  return {
    query,
    selectedType,
    selectedTag,
    selectedStack,
    selectedRole,
    selectedYear,
    featuredOnly,
    state,
    typeOptions,
    tagOptions,
    stackOptions,
    roleOptions,
    yearOptions,
    filteredEntries,
    resultCount,
    resetSearch,
  }
}

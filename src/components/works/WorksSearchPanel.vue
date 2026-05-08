<script setup lang="ts">
import { computed } from 'vue'
import type { WorkCollectionSort } from '@/markdown/pageRegistry'
import type { PortfolioFacetItem } from '@/utils/portfolioSearch'
import WorkFilterChip from '@/components/portfolio/WorkFilterChip.vue'
import WorkTaxonomyBadge from '@/components/portfolio/WorkTaxonomyBadge.vue'
import { getWorkCategoryLabel, getWorkRoleLabel, getWorkStackLabel } from '@/data/workTaxonomy'

defineProps<{
  typeOptions: PortfolioFacetItem[]
  tagOptions: PortfolioFacetItem[]
  stackOptions: PortfolioFacetItem[]
  roleOptions: PortfolioFacetItem[]
  yearOptions: PortfolioFacetItem[]
  resultCount: number
  totalCount: number
}>()

const query = defineModel<string>('query', { required: true })
const selectedType = defineModel<string>('selectedType', { required: true })
const selectedTag = defineModel<string>('selectedTag', { required: true })
const selectedStack = defineModel<string>('selectedStack', { required: true })
const selectedRole = defineModel<string>('selectedRole', { required: true })
const selectedYear = defineModel<string>('selectedYear', { required: true })
const featuredOnly = defineModel<boolean>('featuredOnly', { required: true })
const sort = defineModel<WorkCollectionSort>('sort', { required: true })

const emit = defineEmits<{
  reset: []
}>()

const activeFilterChips = computed(() => {
  const chips: { key: string; label: string; value: string; clear: () => void }[] = []
  if (selectedType.value) {
    chips.push({ key: 'category', label: 'Category', value: getWorkCategoryLabel(selectedType.value), clear: () => { selectedType.value = '' } })
  }
  if (selectedRole.value) {
    chips.push({ key: 'role', label: 'Role', value: getWorkRoleLabel(selectedRole.value), clear: () => { selectedRole.value = '' } })
  }
  if (selectedStack.value) {
    chips.push({ key: 'stack', label: 'Stack', value: getWorkStackLabel(selectedStack.value), clear: () => { selectedStack.value = '' } })
  }
  if (selectedTag.value) {
    chips.push({ key: 'tag', label: 'Tag', value: selectedTag.value, clear: () => { selectedTag.value = '' } })
  }
  if (selectedYear.value) {
    chips.push({ key: 'year', label: 'Year', value: selectedYear.value, clear: () => { selectedYear.value = '' } })
  }
  if (featuredOnly.value) {
    chips.push({ key: 'featured', label: 'Featured', value: 'Only', clear: () => { featuredOnly.value = false } })
  }
  return chips
})

function resetAllFilters() {
  emit('reset')
}
</script>

<template>
  <section class="vt-works-search" aria-labelledby="works-search-title">
    <div class="vt-works-search__summary" aria-live="polite" id="works-search-summary">
      <strong id="works-search-title">{{ resultCount }}</strong>
      <span>/ {{ totalCount }} works found</span>
    </div>

    <label class="vt-works-search__field vt-works-search__field--query">
      <span>Search</span>
      <input
        v-model="query"
        type="search"
        placeholder="작업, 역할, 스택, 태그 검색"
        aria-describedby="works-search-summary"
      />
    </label>

    <label class="vt-works-search__field">
      <span>Category</span>
      <select v-model="selectedType">
        <option value="">All</option>
        <option v-for="item in typeOptions" :key="item.value" :value="item.value">
          {{ getWorkCategoryLabel(item.value) }} ({{ item.count }})
        </option>
      </select>
    </label>

    <label class="vt-works-search__field">
      <span>Tag</span>
      <select v-model="selectedTag">
        <option value="">All</option>
        <option v-for="item in tagOptions" :key="item.value" :value="item.value">
          {{ item.value }} ({{ item.count }})
        </option>
      </select>
    </label>

    <label class="vt-works-search__field">
      <span>Stack</span>
      <select v-model="selectedStack">
        <option value="">All</option>
        <option v-for="item in stackOptions" :key="item.value" :value="item.value">
          {{ getWorkStackLabel(item.value) }} ({{ item.count }})
        </option>
      </select>
    </label>

    <label class="vt-works-search__field">
      <span>Role</span>
      <select v-model="selectedRole">
        <option value="">All</option>
        <option v-for="item in roleOptions" :key="item.value" :value="item.value">
          {{ getWorkRoleLabel(item.value) }} ({{ item.count }})
        </option>
      </select>
    </label>

    <label class="vt-works-search__field">
      <span>Year</span>
      <select v-model="selectedYear">
        <option value="">All</option>
        <option v-for="item in yearOptions" :key="item.value" :value="item.value">
          {{ item.value }} ({{ item.count }})
        </option>
      </select>
    </label>

    <label class="vt-works-search__toggle">
      <input v-model="featuredOnly" type="checkbox" />
      <span>Featured only</span>
    </label>

    <label class="vt-works-search__field">
      <span>Sort</span>
      <select v-model="sort">
        <option value="featured">Featured</option>
        <option value="year">Year</option>
        <option value="title">Title</option>
        <option value="type">Type</option>
        <option value="order">Legacy order</option>
      </select>
    </label>

    <button class="vt-works-search__reset" type="button" @click="resetAllFilters">
      Reset
    </button>

    <div v-if="activeFilterChips.length" class="vt-works-search__active" aria-label="Active work filters">
      <WorkFilterChip
        v-for="chip in activeFilterChips"
        :key="chip.key"
        :label="chip.label"
        :value="chip.value"
        @remove="chip.clear"
      />
    </div>

    <div class="vt-works-taxonomy-preview" aria-label="Work taxonomy examples">
      <WorkTaxonomyBadge value="system" kind="category" />
      <WorkTaxonomyBadge value="developer" kind="role" />
      <WorkTaxonomyBadge value="typescript" kind="stack" />
    </div>
  </section>
</template>

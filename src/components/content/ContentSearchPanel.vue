<script setup lang="ts">
import { computed } from 'vue'
import type { WorkCollectionSort } from '@/markdown/pageRegistry'
import type { PortfolioFacetItem } from '@/utils/portfolioSearch'
import WorkFilterChip from '@/components/portfolio/WorkFilterChip.vue'
import { getWorkRoleLabel, getWorkStackLabel } from '@/data/workTaxonomy'
import { getPublicCategoryLabel } from '@/content/publicContentTaxonomy'

withDefaults(defineProps<{
  typeOptions: PortfolioFacetItem[]
  tagOptions: PortfolioFacetItem[]
  stackOptions: PortfolioFacetItem[]
  roleOptions: PortfolioFacetItem[]
  yearOptions: PortfolioFacetItem[]
  resultCount: number
  totalCount: number
  noun?: string
}>(), {
  noun: '콘텐츠',
})

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

  if (selectedType.value) chips.push({ key: 'category', label: '분류', value: getPublicCategoryLabel(selectedType.value), clear: () => { selectedType.value = '' } })
  if (selectedRole.value) chips.push({ key: 'role', label: '역할', value: getWorkRoleLabel(selectedRole.value), clear: () => { selectedRole.value = '' } })
  if (selectedStack.value) chips.push({ key: 'stack', label: '스택', value: getWorkStackLabel(selectedStack.value), clear: () => { selectedStack.value = '' } })
  if (selectedTag.value) chips.push({ key: 'tag', label: '태그', value: selectedTag.value, clear: () => { selectedTag.value = '' } })
  if (selectedYear.value) chips.push({ key: 'year', label: '연도', value: selectedYear.value, clear: () => { selectedYear.value = '' } })
  if (featuredOnly.value) chips.push({ key: 'featured', label: 'Featured', value: 'Only', clear: () => { featuredOnly.value = false } })

  return chips
})
</script>

<template>
  <section class="vt-works-search vt-works-search--contained" aria-labelledby="content-search-title">
    <header class="vt-works-search__header">
      <div class="vt-works-search__summary" aria-live="polite" id="content-search-summary">
        <strong id="content-search-title">{{ resultCount }}</strong>
        <span>/ {{ totalCount }}개 {{ noun }}</span>
      </div>

      <button class="vt-works-search__reset" type="button" aria-label="Reset content filters" @click="emit('reset')">
        <span>Reset</span>
      </button>
    </header>

    <div class="vt-works-search__controls">
      <label class="vt-works-search__field vt-works-search__field--query">
        <span>검색</span>
        <input v-model="query" type="search" placeholder="제목, 요약, 분류, 태그 검색" aria-describedby="content-search-summary" />
      </label>

      <label class="vt-works-search__field">
        <span>분류</span>
        <select v-model="selectedType">
          <option value="">전체</option>
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">
            {{ getPublicCategoryLabel(item.value) }} ({{ item.count }})
          </option>
        </select>
      </label>

      <label class="vt-works-search__field">
        <span>태그</span>
        <select v-model="selectedTag">
          <option value="">전체</option>
          <option v-for="item in tagOptions" :key="item.value" :value="item.value">
            {{ item.value }} ({{ item.count }})
          </option>
        </select>
      </label>

      <label class="vt-works-search__field">
        <span>기술 스택</span>
        <select v-model="selectedStack">
          <option value="">전체</option>
          <option v-for="item in stackOptions" :key="item.value" :value="item.value">
            {{ getWorkStackLabel(item.value) }} ({{ item.count }})
          </option>
        </select>
      </label>

      <label class="vt-works-search__field">
        <span>역할</span>
        <select v-model="selectedRole">
          <option value="">전체</option>
          <option v-for="item in roleOptions" :key="item.value" :value="item.value">
            {{ getWorkRoleLabel(item.value) }} ({{ item.count }})
          </option>
        </select>
      </label>

      <label class="vt-works-search__field">
        <span>연도</span>
        <select v-model="selectedYear">
          <option value="">전체</option>
          <option v-for="item in yearOptions" :key="item.value" :value="item.value">
            {{ item.value }} ({{ item.count }})
          </option>
        </select>
      </label>

      <label class="vt-works-search__toggle">
        <input v-model="featuredOnly" type="checkbox" />
        <span>대표 콘텐츠만</span>
      </label>

      <label class="vt-works-search__field">
        <span>정렬</span>
        <select v-model="sort">
          <option value="featured">대표순</option>
          <option value="year">연도순</option>
          <option value="title">이름순</option>
          <option value="type">분류순</option>
          <option value="order">기존 순서</option>
        </select>
      </label>
    </div>

    <div v-if="activeFilterChips.length" class="vt-works-search__active" aria-label="Active content filters">
      <WorkFilterChip v-for="chip in activeFilterChips" :key="chip.key" :label="chip.label" :value="chip.value" @remove="chip.clear" />
    </div>
  </section>
</template>

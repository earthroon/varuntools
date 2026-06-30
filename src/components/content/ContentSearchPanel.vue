<script setup lang="ts">
import { computed } from 'vue'

type CategoryOption = { value: string; label: string; count: number }
type FacetOption = { value: string; count: number }

const props = defineProps<{
  categoryOptions: readonly CategoryOption[]
  tagOptions: readonly FacetOption[]
  yearOptions: readonly FacetOption[]
  resultCount: number
  totalCount: number
  surface?: 'inline' | 'desktop-stitch'
}>()

const query = defineModel<string>('query', { required: true })
const selectedCategory = defineModel<string>('selectedCategory', { required: true })
const selectedTag = defineModel<string>('selectedTag', { required: true })
const selectedYear = defineModel<string>('selectedYear', { required: true })
const featuredOnly = defineModel<boolean>('featuredOnly', { required: true })
const sort = defineModel<string>('sort', { required: true })

const emit = defineEmits<{
  reset: []
}>()

const activeChips = computed(() => {
  const chips: { key: string; label: string; value: string; clear: () => void }[] = []
  const trimmedQuery = query.value.trim()

  if (trimmedQuery) {
    chips.push({
      key: 'query',
      label: '검색',
      value: trimmedQuery,
      clear: () => { query.value = '' },
    })
  }

  if (selectedCategory.value) {
    const option = props.categoryOptions.find((item) => item.value === selectedCategory.value)
    chips.push({
      key: 'category',
      label: '작업 유형',
      value: option?.label || selectedCategory.value,
      clear: () => { selectedCategory.value = '' },
    })
  }

  if (selectedTag.value) {
    chips.push({
      key: 'tag',
      label: '태그',
      value: selectedTag.value,
      clear: () => { selectedTag.value = '' },
    })
  }

  if (selectedYear.value) {
    chips.push({
      key: 'year',
      label: '연도',
      value: selectedYear.value,
      clear: () => { selectedYear.value = '' },
    })
  }

  if (featuredOnly.value) {
    chips.push({
      key: 'featured',
      label: '대표',
      value: '콘텐츠만',
      clear: () => { featuredOnly.value = false },
    })
  }

  return chips
})
</script>

<template>
  <section
    class="vt-works-search vt-works-search--contained"
    :class="{
      'vt-works-search--desktop-stitch': props.surface === 'desktop-stitch',
    }"
    aria-labelledby="content-search-title"
  >
    <header class="vt-works-search__header">
      <div class="vt-works-search__summary" aria-live="polite" id="content-search-summary">
        <strong id="content-search-title">{{ resultCount }}</strong>
        <span>/ {{ totalCount }}개 콘텐츠</span>
      </div>
      <button class="vt-works-search__reset" type="button" aria-label="Reset content filters" @click="emit('reset')">
        <span>Reset</span>
      </button>
    </header>

    <div class="vt-works-search__controls">
      <label class="vt-works-search__field vt-works-search__field--query">
        <span>검색</span>
        <input
          v-model="query"
          type="search"
          placeholder="제목, 요약, 태그 검색"
          aria-describedby="content-search-summary"
        />
      </label>

      <label class="vt-works-search__field">
        <span>작업 유형</span>
        <select v-model="selectedCategory">
          <option value="">전체</option>
          <option v-for="item in categoryOptions" :key="item.value" :value="item.value">
            {{ item.label }} ({{ item.count }})
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
          <option value="category">유형순</option>
          <option value="title">이름순</option>
          <option value="order">기존 순서</option>
        </select>
      </label>
    </div>

    <div v-if="activeChips.length" class="vt-works-search__active" aria-label="Active content filters">
      <button
        v-for="chip in activeChips"
        :key="chip.key"
        type="button"
        class="vt-work-filter-chip"
        :aria-label="chip.label + ' ' + chip.value + ' 필터 해제'"
        @click="chip.clear"
      >
        <span>{{ chip.label }}</span>
        <strong>{{ chip.value }}</strong>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.vt-works-search--desktop-stitch {
  position: relative;
  z-index: 1;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.vt-works-search--desktop-stitch .vt-works-search__controls {
  grid-template-columns: 1fr;
}

.vt-works-search--desktop-stitch input,
.vt-works-search--desktop-stitch select {
  min-width: 0;
  width: 100%;
}
</style>

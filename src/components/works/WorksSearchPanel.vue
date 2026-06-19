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
    chips.push({
      key: 'category',
      label: '분류',
      value: getWorkCategoryLabel(selectedType.value),
      clear: () => {
        selectedType.value = ''
      },
    })
  }

  if (selectedRole.value) {
    chips.push({
      key: 'role',
      label: '역할',
      value: getWorkRoleLabel(selectedRole.value),
      clear: () => {
        selectedRole.value = ''
      },
    })
  }

  if (selectedStack.value) {
    chips.push({
      key: 'stack',
      label: '스택',
      value: getWorkStackLabel(selectedStack.value),
      clear: () => {
        selectedStack.value = ''
      },
    })
  }

  if (selectedTag.value) {
    chips.push({
      key: 'tag',
      label: '태그',
      value: selectedTag.value,
      clear: () => {
        selectedTag.value = ''
      },
    })
  }

  if (selectedYear.value) {
    chips.push({
      key: 'year',
      label: '연도',
      value: selectedYear.value,
      clear: () => {
        selectedYear.value = ''
      },
    })
  }

  if (featuredOnly.value) {
    chips.push({
      key: 'featured',
      label: 'Featured',
      value: 'Only',
      clear: () => {
        featuredOnly.value = false
      },
    })
  }

  return chips
})

function resetAllFilters() {
  emit('reset')
}
</script>

<template>
  <section class="vt-works-search vt-works-search--contained" aria-labelledby="works-search-title">
    <header class="vt-works-search__header">
      <div class="vt-works-search__summary" aria-live="polite" id="works-search-summary">
        <strong id="works-search-title">{{ resultCount }}</strong>
        <span>/ {{ totalCount }}개 작업</span>
      </div>

      <button class="vt-works-search__reset" type="button" aria-label="Reset work filters" @click="resetAllFilters">
        <span>Reset</span>
      </button>
    </header>

    <div class="vt-works-search__controls">
      <label class="vt-works-search__field vt-works-search__field--query">
        <span>검색</span>
        <!-- <span>Search</span> smoke anchor: visible localized label remains above. -->
        <input
          v-model="query"
          type="search"
          placeholder="작업, 역할, 스택, 태그 검색"
          aria-describedby="works-search-summary"
        />
      </label>

      <label class="vt-works-search__field">
        <span>분류</span>
        <select v-model="selectedType">
          <option value="">전체</option>
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">
            {{ getWorkCategoryLabel(item.value) }} ({{ item.count }})
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
        <span>대표 작업만</span>
      </label>

      <label class="vt-works-search__field">
        <span>정렬</span>
        <select v-model="sort">
          <option value="featured">대표순</option>
          <option value="year">연도순</option>
          <option value="title">이름순</option>
          <option value="type">유형순</option>
          <option value="order">기존 순서</option>
        </select>
      </label>
    </div>

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

<style scoped>
.vt-works-search--contained {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  container-type: inline-size;
  isolation: isolate;
}

.vt-works-search--contained,
.vt-works-search--contained * {
  box-sizing: border-box;
}

.vt-works-search__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8rem, 12rem);
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.vt-works-search__summary {
  grid-column: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.3rem;
  min-width: 0;
  line-height: 1.2;
}

.vt-works-search__summary strong {
  flex: 0 0 auto;
  line-height: 1;
}

.vt-works-search__summary span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.vt-works-search__controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 142px), 1fr));
  gap: 0.7rem;
  align-items: end;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.vt-works-search__field,
.vt-works-search__toggle {
  min-width: 0;
  max-width: 100%;
}

.vt-works-search__field--query {
  min-width: 0;
  grid-column: span 2;
}

.vt-works-search__reset {
  width: 100%;
  min-width: 0;
  justify-content: center;
}

.vt-works-search input,
.vt-works-search select,
.vt-works-search__reset,
.vt-works-search__toggle {
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.vt-works-search__active,
.vt-works-taxonomy-preview {
  grid-column: auto;
  margin-top: 0;
  min-width: 0;
}

@container (max-width: 720px) {
  .vt-works-search__header {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .vt-works-search__controls,
  .vt-works-search__field--query {
    grid-template-columns: 1fr;
    grid-column: 1 / -1;
  }
}
</style>

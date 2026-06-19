<script setup lang="ts">
import type { WorkCollectionSort } from '@/markdown/pageRegistry'

defineProps<{
  kinds: string[]
  roles: string[]
  stacks: string[]
  tags: string[]
  years: string[]
  resultCount: number
  totalCount: number
}>()

const query = defineModel<string>('query', { required: true })
const kind = defineModel<string>('kind', { required: true })
const role = defineModel<string>('role', { required: true })
const stack = defineModel<string>('stack', { required: true })
const tag = defineModel<string>('tag', { required: true })
const year = defineModel<string>('year', { required: true })
const featuredOnly = defineModel<boolean>('featuredOnly', { required: true })
const sort = defineModel<WorkCollectionSort>('sort', { required: true })

defineEmits<{
  reset: []
}>()
</script>

<template>
  <section class="vt-work-filters" aria-label="작업 목록 필터">
    <div class="vt-work-filters__summary" aria-live="polite">
      <strong>{{ resultCount }}</strong>
      <span>/ {{ totalCount }} entries</span>
    </div>

    <label class="vt-work-filters__field vt-work-filters__field--search">
      <span>검색</span>
      <input
        v-model="query"
        type="search"
        placeholder="작업, 역할, 스택, 태그 검색"
      />
    </label>

    <label class="vt-work-filters__field">
      <span>Type</span>
      <select v-model="kind">
        <option value="">전체</option>
        <option v-for="item in kinds" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>역할</span>
      <select v-model="role">
        <option value="">전체</option>
        <option v-for="item in roles" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>기술 스택</span>
      <select v-model="stack">
        <option value="">전체</option>
        <option v-for="item in stacks" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>태그</span>
      <select v-model="tag">
        <option value="">전체</option>
        <option v-for="item in tags" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>연도</span>
      <select v-model="year">
        <option value="">전체</option>
        <option v-for="item in years" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__toggle" data-legacy-label="Featured only">
      <input v-model="featuredOnly" type="checkbox" />
      <span>대표 작업만</span>
    </label>

    <label class="vt-work-filters__field">
      <span>정렬</span>
      <select v-model="sort">
        <option value="featured">Featured</option>
        <option value="year">연도순</option>
        <option value="title">Title</option>
        <option value="type">Type</option>
        <option value="order">Legacy order</option>
      </select>
    </label>

    <button
      class="vt-work-filters__reset"
      type="button"
      @click="$emit('reset')"
    >
      Reset
    </button>
  </section>
</template>

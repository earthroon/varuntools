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
      <span>Search</span>
      <input
        v-model="query"
        type="search"
        placeholder="작업, 역할, 스택, 태그 검색"
      />
    </label>

    <label class="vt-work-filters__field">
      <span>Type</span>
      <select v-model="kind">
        <option value="">All</option>
        <option v-for="item in kinds" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>Role</span>
      <select v-model="role">
        <option value="">All</option>
        <option v-for="item in roles" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>Stack</span>
      <select v-model="stack">
        <option value="">All</option>
        <option v-for="item in stacks" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>Tag</span>
      <select v-model="tag">
        <option value="">All</option>
        <option v-for="item in tags" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__field">
      <span>Year</span>
      <select v-model="year">
        <option value="">All</option>
        <option v-for="item in years" :key="item" :value="item">
          {{ item }}
        </option>
      </select>
    </label>

    <label class="vt-work-filters__toggle">
      <input v-model="featuredOnly" type="checkbox" />
      <span>Featured only</span>
    </label>

    <label class="vt-work-filters__field">
      <span>Sort</span>
      <select v-model="sort">
        <option value="featured">Featured</option>
        <option value="year">Year</option>
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

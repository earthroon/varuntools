<script setup lang="ts">
import { computed } from 'vue'
import ContentSearchPanel from '@/components/content/ContentSearchPanel.vue'
import ContentCollectionGrid from '@/components/content/ContentCollectionGrid.vue'
import { useRouteManifest } from '@/composables/useRouteManifest'
import { usePublicContentCollection } from '@/composables/usePublicContentCollection'
import { usePageMeta } from '@/composables/usePageMeta'
import { createWorksPageMeta } from '@/metadata/staticPageMeta'

const { pages } = useRouteManifest()
const pageMeta = computed(() => createWorksPageMeta())

usePageMeta(pageMeta)

const {
  query,
  category,
  tag,
  year,
  featuredOnly,
  sort,
  allEntries,
  filteredEntries,
  categoryOptions,
  tagOptions,
  yearOptions,
  resetFilters,
} = usePublicContentCollection(pages, { scope: 'works' })
</script>

<template>
  <article class="vt-markdown-page theme-showroom">
    <div class="vt-markdown vt-works-page">
      <header class="vt-works-hero">
        <p class="vt-works-hero__eyebrow">VARUNTOOLS 인덱스</p>
        <h1>작업</h1>
        <p>
          작업과 사례를 분류별로 탐색하는 작업 인덱스입니다.
        </p>
      </header>

      <ContentSearchPanel
        v-model:query="query"
        v-model:selected-category="category"
        v-model:selected-tag="tag"
        v-model:selected-year="year"
        v-model:featured-only="featuredOnly"
        v-model:sort="sort"
        :category-options="categoryOptions"
        :tag-options="tagOptions"
        :year-options="yearOptions"
        :result-count="filteredEntries.length"
        :total-count="allEntries.length"
        @reset="resetFilters"
      />

      <ContentCollectionGrid :entries="filteredEntries" />
    </div>
  </article>
</template>



<script setup lang="ts">
import { computed } from 'vue'
import ContentCollectionGrid from '@/components/content/ContentCollectionGrid.vue'
import ContentSearchPanel from '@/components/content/ContentSearchPanel.vue'
import { useRouteManifest } from '@/composables/useRouteManifest'
import { usePageMeta } from '@/composables/usePageMeta'
import { createPublicContentIndexPageMeta } from '@/metadata/staticPageMeta'
import { usePublicContentCollection } from '@/composables/usePublicContentCollection'

const { pages } = useRouteManifest()
const pageMeta = computed(() => createPublicContentIndexPageMeta())

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
} = usePublicContentCollection(pages, { scope: 'index' })
</script>

<template>
  <article class="vt-markdown-page theme-showroom">
    <div class="vt-markdown vt-works-page">
      <header class="vt-works-hero">
        <p class="vt-works-hero__eyebrow">VARUNTOOLS 인덱스</p>
        <h1>인덱스</h1>
        <p>
          페이지, 글, 작업, 실험, 도구, 상품을 유형별로 탐색하는 공개 콘텐츠 인덱스입니다.
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

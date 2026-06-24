<script setup lang="ts">
import { computed } from 'vue'
import ContentCollectionGrid from '@/components/content/ContentCollectionGrid.vue'
import ContentSearchPanel from '@/components/content/ContentSearchPanel.vue'
import { useRouteManifest } from '@/composables/useRouteManifest'
import { usePublicContentCollection } from '@/composables/usePublicContentCollection'
import { usePageMeta } from '@/composables/usePageMeta'
import { createPublicContentIndexPageMeta } from '@/metadata/staticPageMeta'

const { pages } = useRouteManifest()
const pageMeta = computed(() => createPublicContentIndexPageMeta())

usePageMeta(pageMeta)

const {
  query,
  kind,
  role,
  stack,
  tag,
  year,
  featuredOnly,
  sort,
  allEntries,
  filteredEntries,
  typeOptions,
  roleOptions,
  stackOptions,
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
        <p>페이지, 글, 작업, 실험, 도구, 상품을 분류별로 탐색하는 공개 콘텐츠 인덱스입니다.</p>
      </header>

      <ContentCollectionGrid
        :entries="filteredEntries"
        empty-title="조건에 맞는 콘텐츠가 없습니다."
        empty-body="분류나 검색 조건을 줄여 다시 확인해보세요."
      />

      <ContentSearchPanel
        v-model:query="query"
        v-model:selected-type="kind"
        v-model:selected-role="role"
        v-model:selected-stack="stack"
        v-model:selected-tag="tag"
        v-model:selected-year="year"
        v-model:featured-only="featuredOnly"
        v-model:sort="sort"
        :type-options="typeOptions"
        :role-options="roleOptions"
        :stack-options="stackOptions"
        :tag-options="tagOptions"
        :year-options="yearOptions"
        :result-count="filteredEntries.length"
        :total-count="allEntries.length"
        noun="콘텐츠"
        @reset="resetFilters"
      />
    </div>
  </article>
</template>

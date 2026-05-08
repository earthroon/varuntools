<script setup lang="ts">
import { computed } from 'vue'
import WorksSearchPanel from '@/components/works/WorksSearchPanel.vue'
import WorksCollectionGrid from '@/components/works/WorksCollectionGrid.vue'
import { useRouteManifest } from '@/composables/useRouteManifest'
import { useWorksCollection } from '@/composables/useWorksCollection'
import { usePageMeta } from '@/composables/usePageMeta'
import { createWorksPageMeta } from '@/metadata/staticPageMeta'

const { pages } = useRouteManifest()
const pageMeta = computed(() => createWorksPageMeta())

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
} = useWorksCollection(pages)
</script>

<template>
  <article class="vt-markdown-page theme-showroom">
    <div class="vt-markdown vt-works-page">
      <header class="vt-works-hero">
        <p class="vt-works-hero__eyebrow">VARUNTOOLS INDEX</p>
        <h1>Works</h1>
        <p>
          작업, 도구, 실험, 문서를 frontmatter.work 기준으로 탐색하는 포트폴리오 인덱스입니다.
        </p>
      </header>

      <WorksSearchPanel
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
        @reset="resetFilters"
      />

      <WorksCollectionGrid :entries="filteredEntries" />
    </div>
  </article>
</template>

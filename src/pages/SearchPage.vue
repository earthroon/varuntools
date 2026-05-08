<script setup lang="ts">
import { computed } from 'vue'
import PageSearchPanel from '@/components/search/PageSearchPanel.vue'
import PageSearchResults from '@/components/search/PageSearchResults.vue'
import { usePageSearch } from '@/composables/usePageSearch'
import { usePageMeta } from '@/composables/usePageMeta'
import { resolvePageSeo } from '@/site/seo'

const { query, hasQuery, results, resultCount, resetSearch } = usePageSearch()

const pageMeta = computed(() => {
  const seo = resolvePageSeo({
    title: 'Search',
    description: 'VARUNTOOLS의 작업, 문서, 페이지를 검색합니다.',
    routePath: '/search',
    kind: 'page',
  })

  return {
    title: seo.fullTitle,
    description: seo.description,
    canonicalUrl: seo.canonicalUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImageUrl,
    ogType: seo.ogType,
    twitterCard: seo.twitterCard,
    robots: seo.robots,
  }
})

usePageMeta(pageMeta)
</script>

<template>
  <article class="vt-markdown-page theme-showroom">
    <div class="vt-page-search">
      <header class="vt-page-search__hero">
        <p class="vt-page-search__eyebrow">VARUNTOOLS SEARCH</p>
        <h1>Search</h1>
        <p>작업, 문서, 상품, 페이지를 한 번에 찾는 로컬 사이트 검색입니다.</p>
      </header>

      <PageSearchPanel
        v-model:query="query"
        :result-count="resultCount"
        :has-query="hasQuery"
        @reset="resetSearch"
      />

      <PageSearchResults :results="results" :has-query="hasQuery" />
    </div>
  </article>
</template>

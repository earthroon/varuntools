<script setup lang="ts">
import type { PageSearchResult } from '@/utils/pageSearch'

defineProps<{
  results: PageSearchResult[]
  hasQuery: boolean
}>()
</script>

<template>
  <section class="vt-page-search__results" aria-label="검색 결과">
    <div v-if="!hasQuery" class="vt-page-search__empty">
      <strong>무엇을 찾을까요?</strong>
      <p>예: CSV 작성법, 포트폴리오, 보안, Cloudflare, 다운로드</p>
    </div>

    <div v-else-if="!results.length" class="vt-page-search__empty">
      <strong>검색 결과가 없습니다.</strong>
      <p>검색어를 줄이거나 다른 표현으로 다시 찾아보세요.</p>
    </div>

    <ol v-else class="vt-page-search__list">
      <li v-for="result in results" :key="`${result.type}-${result.slug}`" class="vt-page-search__item">
        <a :href="result.href" class="vt-page-search__card">
          <span class="vt-page-search__type">{{ result.type }}</span>
          <strong>{{ result.title }}</strong>
          <p v-if="result.description">{{ result.description }}</p>
          <span class="vt-page-search__href">{{ result.href }}</span>
          <span v-if="result.matchedFields.length" class="vt-page-search__matches">
            일치 항목: {{ result.matchedFields.join(', ') }}
          </span>
        </a>
      </li>
    </ol>
  </section>
</template>

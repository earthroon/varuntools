<script setup lang="ts">
import { computed } from 'vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { createNotFoundPageMeta } from '@/metadata/staticPageMeta'

const pageMeta = computed(() => createNotFoundPageMeta())

usePageMeta(pageMeta)
</script>

<template>
  <article class="vt-markdown-page theme-showroom">
    <div class="vt-markdown vt-markdown-not-found">
      <p class="vt-not-found__eyebrow">404</p>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>요청한 경로에 해당하는 문서가 없습니다.</p>
      <RouterLink class="vt-not-found__link" to="/">
        홈으로 돌아가기
      </RouterLink>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownDocumentView from '@/components/markdown/MarkdownDocumentView.vue'
import { loadMarkdownPageBySlug } from '@/markdown/lazyMarkdownPageLoader'
import { normalizePageSlug } from '@/markdown/pageLookup'
import type { LoadedMarkdownPage } from '@/markdown/types'

type MarkdownRouteLoadState = 'idle' | 'loading' | 'ready' | 'not_found' | 'error'

const route = useRoute()
const slug = computed(() => normalizePageSlug(route.params.slug, 'home'))

const page = shallowRef<LoadedMarkdownPage | null>(null)
const loadState = ref<MarkdownRouteLoadState>('idle')
const loadError = ref('')
let requestId = 0

watch(
  slug,
  async (nextSlug) => {
    const currentRequestId = ++requestId
    loadState.value = 'loading'
    loadError.value = ''
    page.value = null

    try {
      const loaded = await loadMarkdownPageBySlug(nextSlug)
      if (currentRequestId !== requestId) return

      page.value = loaded
      loadState.value = loaded ? 'ready' : 'not_found'
    } catch (error) {
      if (currentRequestId !== requestId) return

      page.value = null
      loadState.value = 'error'
      loadError.value = error instanceof Error ? error.message : String(error)
    }
  },
  { immediate: true },
)

const notFoundTitle = computed(() => {
  switch (loadState.value) {
    case 'loading':
      return '문서를 불러오는 중입니다'
    case 'error':
      return '문서를 불러오지 못했습니다'
    default:
      return '페이지를 찾을 수 없습니다'
  }
})

const notFoundMessage = computed(() => {
  switch (loadState.value) {
    case 'loading':
      return '현재 경로의 문서를 준비하고 있습니다.'
    case 'error':
      return loadError.value || '문서 로드 중 오류가 발생했습니다.'
    default:
      return '요청한 문서가 아직 등록되지 않았습니다.'
  }
})
</script>

<template>
  <MarkdownDocumentView
    :page="page"
    :pages="[]"
    :show-related-footer="false"
    :not-found-title="notFoundTitle"
    :not-found-message="notFoundMessage"
  />
</template>

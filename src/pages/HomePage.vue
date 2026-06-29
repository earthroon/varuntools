<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import MarkdownDocumentView from '@/components/markdown/MarkdownDocumentView.vue'
import HomeFeaturedWorks from '@/components/home/HomeFeaturedWorks.vue'
import HomeRecentPublicContent from '@/components/home/HomeRecentPublicContent.vue'
import { loadMarkdownPageBySlug } from '@/markdown/lazyMarkdownPageLoader'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { afterFirstPaint } from '@/utils/afterFirstPaint'

type HomeLoadState = 'loading' | 'ready' | 'not_found' | 'error'

const page = shallowRef<LoadedMarkdownPage | null>(null)
const loadState = ref<HomeLoadState>('loading')
const loadError = ref('')
const canMountHomeCollections = ref(false)
const emptyPages: LoadedMarkdownPage[] = []
let disposed = false
let cancelHomeCollectionsMount: (() => void) | null = null

const statusTitle = computed(() => {
  if (loadState.value === 'error') return '홈 문서를 불러오지 못했습니다'
  if (loadState.value === 'loading') return '홈 문서를 불러오는 중입니다'
  return '페이지를 찾을 수 없습니다'
})

const statusMessage = computed(() => {
  if (loadState.value === 'loading') return 'VARUNTOOLS 홈 문서를 준비하고 있습니다.'
  if (loadState.value === 'error') return loadError.value || '홈 문서 로드 중 알 수 없는 오류가 발생했습니다.'
  return '요청한 홈 문서가 아직 등록되지 않았습니다.'
})

async function loadHomePage(): Promise<void> {
  loadState.value = 'loading'
  loadError.value = ''

  try {
    const loaded = await loadMarkdownPageBySlug('home')
    if (disposed) return

    page.value = loaded
    loadState.value = loaded ? 'ready' : 'not_found'
  } catch (error) {
    if (disposed) return

    page.value = null
    loadError.value = error instanceof Error ? error.message : String(error)
    loadState.value = 'error'
  }
}

void loadHomePage()

onMounted(() => {
  cancelHomeCollectionsMount = afterFirstPaint(() => {
    if (!disposed) canMountHomeCollections.value = true
  })
})

onBeforeUnmount(() => {
  disposed = true
  cancelHomeCollectionsMount?.()
  cancelHomeCollectionsMount = null
})
</script>

<template>
  <MarkdownDocumentView
    :page="page"
    :pages="emptyPages"
    :show-related-footer="false"
    :not-found-title="statusTitle"
    :not-found-message="statusMessage"
  />

  <template v-if="canMountHomeCollections">
    <HomeRecentPublicContent />
    <HomeFeaturedWorks />
  </template>
</template>

<script setup lang="ts">
import MarkdownDocumentView from '@/components/markdown/MarkdownDocumentView.vue'
import HomeFeaturedWorks from '@/components/home/HomeFeaturedWorks.vue'
import HomeRecentPublicContent from '@/components/home/HomeRecentPublicContent.vue'
import homeMarkdownRaw from '@/content/pages/home/index.md?raw'
import { loadMarkdownPageFromSource } from '@/markdown/loadMarkdownPageFromSource'
import type { LoadedMarkdownPage } from '@/markdown/types'

const emptyPages: LoadedMarkdownPage[] = []
const page = loadMarkdownPageFromSource(String(homeMarkdownRaw || ''), 'home')
</script>

<template>
  <MarkdownDocumentView
      page-shell="compact"
    :page="page"
    :pages="emptyPages"
    :show-related-footer="false"
  />
  <div
    class="vt-home-late-container vt-home-late-container--recent"
    data-vacms-late-container="recent"
  >
    <HomeRecentPublicContent />
  </div>
  <div
    class="vt-home-late-container vt-home-late-container--featured"
    data-vacms-late-container="featured"
  >
    <HomeFeaturedWorks />
  </div>
</template>

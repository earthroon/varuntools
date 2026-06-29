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
    :page="page"
    :pages="emptyPages"
    :show-related-footer="false"
  />

  <HomeRecentPublicContent />
  <HomeFeaturedWorks />
</template>

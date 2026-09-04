<script setup lang="ts">
import MarkdownDocumentView from '@/components/markdown/MarkdownDocumentView.vue'
import HomeFeaturedWorks from '@/components/home/HomeFeaturedWorks.vue'
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
  <HomeFeaturedWorks />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownDocumentView from '@/components/markdown/MarkdownDocumentView.vue'
import HomeFeaturedWorks from '@/components/home/HomeFeaturedWorks.vue'
import { findMarkdownPageBySlug } from '@/markdown/pageLookup'
import { useRouteManifest } from '@/composables/useRouteManifest'

const { pages } = useRouteManifest()
const page = computed(() => findMarkdownPageBySlug(pages, 'home'))
</script>

<template>
  <MarkdownDocumentView
    :page="page"
    :pages="pages"
    :show-related-footer="false"
  />

  <HomeFeaturedWorks :pages="pages" />
</template>

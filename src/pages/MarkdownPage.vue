<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownDocumentView from '@/components/markdown/MarkdownDocumentView.vue'
import {
  findMarkdownPageBySlug,
  normalizePageSlug,
} from '@/markdown/pageLookup'
import { useRouteManifest } from '@/composables/useRouteManifest'

const route = useRoute()
const { pages } = useRouteManifest()

const slug = computed(() => normalizePageSlug(route.params.slug, 'home'))
const page = computed(() => findMarkdownPageBySlug(pages, slug.value))
</script>

<template>
  <MarkdownDocumentView :page="page" :pages="pages" />
</template>

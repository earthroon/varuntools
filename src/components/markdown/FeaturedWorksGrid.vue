<script setup lang="ts">
import { computed } from 'vue'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { getFeaturedWorkEntries } from '@/markdown/pageRegistry'
import WorkCard from './WorkCard.vue'

const props = withDefaults(
  defineProps<{
    pages: LoadedMarkdownPage[]
    title?: string
    kind?: string
    limit?: number
  }>(),
  {
    title: '',
    kind: '',
    limit: 12,
  },
)

const entries = computed(() => {
  const all = getFeaturedWorkEntries(props.pages)
  const filtered = props.kind
    ? all.filter((entry) => entry.kind === props.kind)
    : all

  return filtered.slice(0, Math.max(1, props.limit))
})
</script>

<template>
  <section v-if="entries.length" class="vt-featured-works">
    <h2 v-if="title" class="vt-featured-works__title">{{ title }}</h2>

    <div class="vt-featured-works__grid">
      <WorkCard
        v-for="entry in entries"
        :key="entry.slug"
        :slug="entry.slug"
        :title="entry.title"
        :description="entry.description"
        :cover="entry.cover"
        :href="entry.href"
        :tag="entry.kind"
        :content-dir="entry.contentDir"
      />
    </div>
  </section>
</template>

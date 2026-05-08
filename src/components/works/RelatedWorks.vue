<script setup lang="ts">
import WorkCard from '@/components/markdown/WorkCard.vue'
import type { WorkCardEntry } from '@/markdown/pageRegistry'

withDefaults(
  defineProps<{
    entries: WorkCardEntry[]
    title?: string
  }>(),
  {
    title: 'Related Works',
  },
)
</script>

<template>
  <section v-if="entries.length" class="vt-related-works">
    <h2 class="vt-related-works__title">{{ title }}</h2>
    <div class="vt-related-works__grid">
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

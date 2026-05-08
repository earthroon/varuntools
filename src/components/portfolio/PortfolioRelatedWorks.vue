<script setup lang="ts">
import { computed } from 'vue'
import WorkCard from '@/components/markdown/WorkCard.vue'
import {
  getWorkCollectionEntries,
  normalizeRelatedWorkSlug,
  resolveRelatedWorkEntries,
} from '@/markdown/pageRegistry'
import type { LoadedMarkdownPage } from '@/markdown/types'

const props = withDefaults(
  defineProps<{
    pages?: LoadedMarkdownPage[]
    currentSlug?: string
    title?: string
    items?: string[]
    layout?: string
    showStatus?: boolean | string
    limit?: number | string
    html?: string
  }>(),
  {
    pages: () => [],
    currentSlug: '',
    title: 'Related Works',
    items: () => [],
    layout: 'grid',
    showStatus: false,
    limit: 0,
    html: '',
  },
)

function asBoolean(value: boolean | string | undefined): boolean {
  if (typeof value === 'boolean') return value
  return String(value || '').toLowerCase() === 'true'
}

function asLimit(value: number | string | undefined): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const normalizedItems = computed(() => {
  const seen = new Set<string>()
  const output: string[] = []
  for (const item of props.items || []) {
    const slug = normalizeRelatedWorkSlug(item)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    output.push(slug)
  }
  return output
})

const entries = computed(() => resolveRelatedWorkEntries(
  getWorkCollectionEntries(props.pages),
  normalizedItems.value,
  {
    currentSlug: props.currentSlug,
    limit: asLimit(props.limit),
  },
))

const showStatusBadge = computed(() => asBoolean(props.showStatus))
</script>

<template>
  <section class="vt-related-works vt-related-works--portfolio" :data-layout="layout">
    <h2 class="vt-related-works__title">{{ title }}</h2>
    <div v-if="html" class="vt-markdown vt-related-works__intro" v-html="html" />
    <div v-if="entries.length" class="vt-related-works__grid">
      <WorkCard
        v-for="entry in entries"
        :key="entry.slug"
        :slug="entry.slug"
        :title="entry.title"
        :description="entry.summary || entry.description"
        :cover="entry.cover"
        :href="entry.href"
        :tag="entry.type || entry.kind"
        :content-dir="entry.contentDir"
        :role="entry.role"
        :stack="entry.stack"
        :tags="entry.tags"
        :year="entry.year"
        :period="entry.period"
        :featured="entry.featured"
        :status="showStatusBadge ? entry.workStatus : ''"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { getFeaturedWorkEntries } from '@/markdown/pageRegistry'
import WorkCard from './WorkCard.vue'

type ManualFeaturedWorkItem = {
  id: string
  title: string
  href: string
  label: string
}

const props = withDefaults(
  defineProps<{
    pages: LoadedMarkdownPage[]
    title?: string
    kind?: string
    items?: string[]
    layout?: string
    limit?: number
  }>(),
  {
    title: '',
    kind: '',
    items: () => [],
    layout: 'grid',
    limit: 12,
  },
)

function trimSlash(value: string): string {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '')
}

function normalizeHref(value: string, fallbackId = ''): string {
  const href = String(value || '').trim()
  if (/^(https?:\/\/|\/)/i.test(href)) return href

  const id = trimSlash(href || fallbackId)
  if (!id) return '#'
  if (id.includes('/')) return '/' + id
  return '/works/' + id
}

function parseManualItem(value: string): ManualFeaturedWorkItem | null {
  const [id = '', title = '', href = '', label = ''] = String(value || '')
    .split('|')
    .map((part) => part.trim())

  const cleanId = trimSlash(id)
  const cleanTitle = title.trim()
  const normalizedHref = normalizeHref(href, cleanId)

  if (!cleanId && !cleanTitle && normalizedHref === '#') return null

  return {
    id: cleanId || trimSlash(normalizedHref) || cleanTitle,
    title: cleanTitle,
    href: normalizedHref,
    label: label.trim(),
  }
}

const entries = computed(() => {
  const all = getFeaturedWorkEntries(props.pages)

  const manualItems = props.items
    .map(parseManualItem)
    .filter((item): item is ManualFeaturedWorkItem => Boolean(item))

  if (manualItems.length) {
    return manualItems
      .map((item) => {
        const normalizedId = trimSlash(item.id)
        const normalizedHref = trimSlash(item.href)
        const registryEntry = all.find((entry) => {
          return (
            trimSlash(entry.slug) === normalizedId ||
            trimSlash(entry.href) === normalizedHref ||
            trimSlash(entry.slug) === normalizedHref ||
            trimSlash(entry.href) === normalizedId
          )
        })

        return {
          slug: registryEntry?.slug || normalizedId || normalizedHref,
          title: item.title || registryEntry?.title || normalizedId || 'Untitled',
          description: registryEntry?.description || '',
          cover: registryEntry?.cover || '',
          href: item.href || registryEntry?.href || '#',
          kind: item.label || registryEntry?.kind || props.kind || '',
          contentDir: registryEntry?.contentDir || '',
        }
      })
      .slice(0, Math.max(1, props.limit))
  }

  const filtered = props.kind
    ? all.filter((entry) => entry.kind === props.kind)
    : all

  return filtered.slice(0, Math.max(1, props.limit))
})
</script>

<template>
  <section
    v-if="entries.length"
    class="vt-featured-works"
    :data-layout="layout"
  >
    <h2 v-if="title" class="vt-featured-works__title">{{ title }}</h2>

    <div class="vt-featured-works__grid">
      <WorkCard
        v-for="entry in entries"
        :key="entry.slug || entry.href"
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

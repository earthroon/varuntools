<script setup lang="ts">
import { computed } from 'vue'
import type { LoadedMarkdownPage } from '@/markdown/types'
import {
  resolveManualPagecard,
  resolvePagecardsByQuery,
  type PagecardGridItemInput,
  type PagecardGridSort,
} from '@/content/pagecardResolver'
import { resolveContentAssetMeta } from '@/markdown/resolveContentAssets'

const props = withDefaults(
  defineProps<{
    pages?: LoadedMarkdownPage[]
    contentDir?: string
    items?: PagecardGridItemInput[]
    query?: string
    tag?: string
    section?: string
    featured?: boolean
    limit?: number
    sort?: PagecardGridSort
    columns?: 'auto' | 'compact' | 'wide'
  }>(),
  {
    pages: () => [],
    contentDir: '',
    items: () => [],
    query: '',
    tag: '',
    section: '',
    featured: false,
    limit: 24,
    sort: 'manual',
    columns: 'auto',
  },
)

const hasManualItems = computed(() => props.items.length > 0)

const resolvedItems = computed(() => {
  if (hasManualItems.value) {
    return props.items
      .map((item) => resolveManualPagecard(props.pages, item))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }

  return resolvePagecardsByQuery(props.pages, {
    query: props.query,
    tag: props.tag,
    section: props.section,
    featured: props.featured,
    limit: props.limit,
    sort: props.sort,
  })
})

function thumbnailUrl(item: { thumbnail: string; contentDir: string }) {
  if (!item.thumbnail) return ''
  const asset = resolveContentAssetMeta(item.contentDir || props.contentDir, item.thumbnail)
  return asset.found ? asset.url : ''
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href)
}
</script>

<template>
  <section
    v-if="resolvedItems.length"
    class="vt-pagecard-grid"
    :data-columns="columns"
  >
    <a
      v-for="item in resolvedItems"
      :key="item.href"
      class="vt-pagecard"
      :href="item.href"
      :target="isExternal(item.href) ? '_blank' : undefined"
      :rel="isExternal(item.href) ? 'noopener noreferrer' : undefined"
    >
      <div class="vt-pagecard__thumb" aria-hidden="true">
        <img
          v-if="thumbnailUrl(item)"
          :src="thumbnailUrl(item)"
          alt=""
          loading="lazy"
          decoding="async"
        />
        <span v-else class="vt-pagecard__fallback" aria-hidden="true">▦</span>
      </div>

      <div class="vt-pagecard__body">
        <strong class="vt-pagecard__title">{{ item.title }}</strong>
        <p v-if="item.description" class="vt-pagecard__description">
          {{ item.description }}
        </p>
        <span v-if="item.tag" class="vt-pagecard__tag">{{ item.tag }}</span>
      </div>
    </a>
  </section>

  <div v-else class="vt-pagecard-grid__empty">
    No pagecards resolved.
  </div>
</template>

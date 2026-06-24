<script setup lang="ts">
import { resolveContentAssetMeta } from '@/markdown/resolveContentAssets'
import { getPublicContentCategoryLabel } from '@/content/publicContentCategoryLabels'
import type { PublicContentCardEntry } from '@/composables/usePublicContentCollection'

defineProps<{
  entries: PublicContentCardEntry[]
}>()

function thumbnailUrl(entry: PublicContentCardEntry): string {
  const thumbnail = entry.thumbnail || entry.cover
  if (!thumbnail) return ''
  const asset = resolveContentAssetMeta(entry.contentDir || '', thumbnail)
  return asset.found ? asset.url : thumbnail
}
</script>

<template>
  <section class="vt-works-collection" aria-label="콘텐츠 목록">
    <div v-if="entries.length" class="vt-works-collection__grid">
      <a
        v-for="entry in entries"
        :key="entry.slug"
        class="vt-work-card"
        :href="entry.href"
      >
        <span class="vt-work-card__media" aria-hidden="true">
          <img
            v-if="thumbnailUrl(entry)"
            :src="thumbnailUrl(entry)"
            alt=""
            loading="lazy"
            decoding="async"
          />
          <span v-else class="vt-work-card__placeholder">No cover</span>
        </span>
        <span class="vt-work-card__body">
          <span class="vt-work-card__badge">{{ getPublicContentCategoryLabel(entry.category) }}</span>
          <strong class="vt-work-card__title">{{ entry.title }}</strong>
          <span v-if="entry.description" class="vt-work-card__description">{{ entry.description }}</span>
          <span v-if="entry.tags.length" class="vt-work-card__tags">
            <span v-for="tag in entry.tags.slice(0, 4)" :key="tag">#{{ tag }}</span>
          </span>
        </span>
      </a>
    </div>

    <article v-else class="vt-work-empty-state">
      <h2>조건에 맞는 콘텐츠가 없습니다.</h2>
      <p>분류나 검색어를 줄여 다시 확인해보세요.</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import WorkCard from '@/components/markdown/WorkCard.vue'
import { getPublicContentCategoryLabel } from '@/content/publicContentCategoryLabels'
import type { PublicContentCardEntry } from '@/composables/usePublicContentCollection'

defineProps<{
  entries: PublicContentCardEntry[]
}>()
</script>

<template>
  <section class="vt-works-collection" aria-label="콘텐츠 목록">
    <div v-if="entries.length" class="vt-works-collection__grid">
      <WorkCard
        v-for="entry in entries"
        :key="entry.slug"
        :slug="entry.slug"
        :title="entry.title"
        :description="entry.description"
        :cover="entry.cover"
        :href="entry.href"
        :tag="getPublicContentCategoryLabel(entry.category)"
        :content-dir="entry.contentDir"
        :tags="entry.tags"
        :year="entry.year"
        :featured="entry.featured"
        :status="entry.status"
      />
    </div>

    <article v-else class="vt-work-empty-state">
      <h2>조건에 맞는 콘텐츠가 없습니다.</h2>
      <p>작업 유형이나 검색어를 줄여 다시 확인해보세요.</p>
    </article>
  </section>
</template>

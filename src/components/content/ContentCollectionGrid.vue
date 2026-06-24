<script setup lang="ts">
import WorkCard from '@/components/markdown/WorkCard.vue'
import WorkEmptyState from '@/components/portfolio/WorkEmptyState.vue'
import type { WorkCardEntry } from '@/markdown/pageRegistry'

withDefaults(defineProps<{
  entries: WorkCardEntry[]
  emptyTitle?: string
  emptyBody?: string
}>(), {
  emptyTitle: '조건에 맞는 콘텐츠가 없습니다.',
  emptyBody: '분류나 검색 조건을 줄여 다시 확인해보세요.',
})
</script>

<template>
  <section class="vt-works-collection" aria-label="콘텐츠 목록">
    <div v-if="entries.length" class="vt-works-collection__grid">
      <WorkCard
        v-for="entry in entries"
        :key="entry.slug"
        :slug="entry.slug"
        :title="entry.title"
        :description="entry.summary || entry.description"
        :cover="entry.cover"
        :href="entry.href"
        :tag="entry.category || entry.type || entry.kind"
        :content-dir="entry.contentDir"
        :role="entry.role"
        :stack="entry.stack"
        :tags="entry.tags"
        :year="entry.year"
        :period="entry.period"
        :featured="entry.featured"
        :status="entry.workStatus"
      />
    </div>

    <WorkEmptyState
      v-else
      :title="emptyTitle"
      :body="emptyBody"
    />
  </section>
</template>

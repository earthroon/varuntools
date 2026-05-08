<script setup lang="ts">
import WorkCard from '@/components/markdown/WorkCard.vue'
import WorkEmptyState from '@/components/portfolio/WorkEmptyState.vue'
import type { WorkCardEntry } from '@/markdown/pageRegistry'

defineProps<{
  entries: WorkCardEntry[]
}>()
</script>

<template>
  <section class="vt-works-collection" aria-label="작업 목록">
    <div v-if="entries.length" class="vt-works-collection__grid">
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
        :status="entry.workStatus"
      />
    </div>

    <WorkEmptyState
      v-else
      title="조건에 맞는 작업이 없습니다."
      body="필터를 줄이거나 전체 작업을 다시 확인해보세요."
    />
  </section>
</template>

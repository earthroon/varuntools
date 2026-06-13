<script setup lang="ts">
import WorkCard from '@/components/markdown/WorkCard.vue'
import type { WorkCardEntry } from '@/markdown/pageRegistry'

defineProps<{
  tag: {
    tag: string
    slug: string
    href: string
    count: number
    title: string
    description: string
  }
  works: WorkCardEntry[]
}>()
</script>

<template>
  <section class="vt-works-tag-landing" :aria-labelledby="`works-tag-${tag.slug}`">
    <nav class="vt-works-tag-landing__breadcrumb" aria-label="경로">
      <a href="/works">작업</a>
      <span aria-hidden="true">/</span>
      <span>태그</span>
      <span aria-hidden="true">/</span>
      <strong>{{ tag.tag }}</strong>
    </nav>

    <header class="vt-works-tag-landing__header">
      <p class="vt-works-tag-landing__eyebrow">포트폴리오 태그</p>
      <h1 :id="`works-tag-${tag.slug}`">{{ tag.title }}</h1>
      <p>{{ tag.description }}</p>
      <p class="vt-works-tag-landing__count" aria-live="polite">
        <strong>{{ works.length }}</strong>개 작업
      </p>
    </header>

    <div v-if="works.length" class="vt-works-tag-landing__grid">
      <WorkCard
        v-for="entry in works"
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

    <div v-else class="vt-works-tag-landing__empty">
      <p>해당 태그의 작업이 없습니다.</p>
      <a href="/works">전체 작업 보기</a>
    </div>
  </section>
</template>

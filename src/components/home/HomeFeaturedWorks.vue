<script setup lang="ts">
import { computed } from 'vue'
import WorkCard from '@/components/markdown/WorkCard.vue'
import { useHomeCollections } from '@/composables/useHomeCollections'

const props = withDefaults(
  defineProps<{
    limit?: number
    title?: string
    description?: string
    showViewAll?: boolean
  }>(),
  {
    limit: 4,
    title: '대표 작업',
    description: 'frontmatter.work 기준으로 고른 대표 작업입니다.',
    showViewAll: true,
  },
)

const { featuredWorks } = useHomeCollections()
const visibleWorks = computed(() => featuredWorks.value.slice(0, props.limit))
</script>

<template>
  <section
    v-if="visibleWorks.length"
    class="vt-home-featured-works"
    aria-labelledby="home-featured-works-title"
  >
    <div class="vt-home-featured-works__header">
      <p class="vt-home-featured-works__eyebrow">포트폴리오</p>
      <div class="vt-home-featured-works__heading-row">
        <div>
          <h2 id="home-featured-works-title">{{ title }}</h2>
          <p v-if="description" class="vt-home-featured-works__description">
            {{ description }}
          </p>
        </div>

        <a v-if="showViewAll" class="vt-home-featured-works__link" href="/works">
          작업 전체 보기
        </a>
      </div>
    </div>

    <div class="vt-home-featured-works__grid">
      <WorkCard
        v-for="entry in visibleWorks"
        :key="entry.slug"
        :slug="entry.slug"
        :title="entry.title"
        :description="entry.description"
        :cover="entry.cover"
        :href="entry.href"
        :tag="entry.work.type || entry.kind"
        :content-dir="entry.contentDir"
        :role="entry.work.role.slice(0, 2)"
        :stack="entry.work.stack.slice(0, 3)"
        :tags="entry.tags.slice(0, 3)"
        :year="entry.year"
        :period="entry.work.period"
        :featured="entry.featured"
        :status="entry.work.status"
      />
    </div>
  </section>
</template>

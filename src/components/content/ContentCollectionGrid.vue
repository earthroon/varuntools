<script setup lang="ts">
import { onMounted, watch } from 'vue'
import WorkCard from '@/components/markdown/WorkCard.vue'
import { prewarmMarkdownNavigationHrefs } from '@/markdown/markdownNavigationPrefetch'
import { getPublicContentCategoryLabel } from '@/content/publicContentCategoryLabels'
import type { PublicContentCardEntry } from '@/composables/usePublicContentCollection'

const props = defineProps<{
  entries: PublicContentCardEntry[]
}>()

const PUBLIC_CONTENT_PREWARM_LIMIT = 8
const prewarmedPublicContentHrefs = new Set<string>()

function runPublicContentPrewarmWhenIdle(callback: () => void): void {
  const windowWithIdle = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
  }

  if (typeof windowWithIdle.requestIdleCallback === 'function') {
    windowWithIdle.requestIdleCallback(callback, { timeout: 500 })
    return
  }

  window.setTimeout(callback, 0)
}

function schedulePublicContentPrewarm(): void {
  const hrefs = props.entries
    .map((entry) => entry.href)
    .filter((href): href is string => Boolean(href && !prewarmedPublicContentHrefs.has(href)))
    .slice(0, PUBLIC_CONTENT_PREWARM_LIMIT)

  if (!hrefs.length) return

  for (const href of hrefs) prewarmedPublicContentHrefs.add(href)

  runPublicContentPrewarmWhenIdle(() => {
    prewarmMarkdownNavigationHrefs(hrefs, PUBLIC_CONTENT_PREWARM_LIMIT)
  })
}

onMounted(schedulePublicContentPrewarm)
watch(() => props.entries, schedulePublicContentPrewarm, { deep: false })

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

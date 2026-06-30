<script setup lang="ts">
import { computed, ref } from 'vue'
import MarkdownToc from '@/components/markdown/MarkdownToc.vue'
import WorkIndexDesktopStitchRail from '@/components/content/WorkIndexDesktopStitchRail.vue'
import ContentCollectionGrid from '@/components/content/ContentCollectionGrid.vue'
import { useRouteManifest } from '@/composables/useRouteManifest'
import { usePublicContentCollection } from '@/composables/usePublicContentCollection'
import { usePageMeta } from '@/composables/usePageMeta'
import { useObservedHeadings } from '@/composables/useObservedHeadings'
import { useActiveHeading } from '@/composables/useActiveHeading'
import { createWorksPageMeta } from '@/metadata/staticPageMeta'

const { pages } = useRouteManifest()
const pageMeta = computed(() => createWorksPageMeta())
const worksRoot = ref<HTMLElement | null>(null)
const { observedHeadings: headings } = useObservedHeadings(worksRoot)
const { activeHeadingId } = useActiveHeading(worksRoot, headings)

usePageMeta(pageMeta)

const {
  query,
  category,
  tag,
  year,
  featuredOnly,
  sort,
  allEntries,
  filteredEntries,
  categoryOptions,
  tagOptions,
  yearOptions,
  resetFilters,
} = usePublicContentCollection(pages, { scope: 'index' })
</script>

<template>
  <article class="vt-markdown-page theme-showroom vt-work-index-page">
    <MarkdownToc
      v-if="headings.length > 0"
      :headings="headings"
      :active-heading-id="activeHeadingId"
    />

    <div class="vt-work-index-shell" data-vt-ui21a-work-index-shell="desktop-stitch-boundary">
      <WorkIndexDesktopStitchRail
        v-model:query="query"
        v-model:selected-category="category"
        v-model:selected-tag="tag"
        v-model:selected-year="year"
        v-model:featured-only="featuredOnly"
        v-model:sort="sort"
        :category-options="categoryOptions"
        :tag-options="tagOptions"
        :year-options="yearOptions"
        :result-count="filteredEntries.length"
        :total-count="allEntries.length"
        @reset="resetFilters"
      />

      <main ref="worksRoot" class="vt-markdown vt-works-page vt-work-index-main">
        <header class="vt-works-hero">
          <p class="vt-works-hero__eyebrow">VARUNTOOLS 인덱스</p>
          <h1>작업</h1>
          <p>
            작업, 실험, 글, 페이지, 도구, 상품을 유형별로 탐색하는 공개 콘텐츠 인덱스입니다.
          </p>
        </header>

        <section class="vt-works-section" aria-labelledby="works-results-heading">
          <h2 id="works-results-heading" class="vt-works-section__heading">공개 콘텐츠</h2>
          <ContentCollectionGrid :entries="filteredEntries" />
        </section>
      </main>
    </div>
  </article>
</template>

<style scoped>
.vt-work-index-shell {
  display: block;
}

.vt-work-index-main {
  min-width: 0;
}

@media (min-width: 1120px) {
  .vt-work-index-shell {
    display: grid;
    grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
    gap: clamp(1.25rem, 3vw, 2.5rem);
    align-items: start;
  }
}
</style>

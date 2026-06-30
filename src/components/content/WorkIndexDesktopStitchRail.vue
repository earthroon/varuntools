<script setup lang="ts">
import ContentSearchPanel from '@/components/content/ContentSearchPanel.vue'

type CategoryOption = { value: string; label: string; count: number }
type FacetOption = { value: string; count: number }

const props = defineProps<{
  categoryOptions: readonly CategoryOption[]
  tagOptions: readonly FacetOption[]
  yearOptions: readonly FacetOption[]
  resultCount: number
  totalCount: number
}>()

const query = defineModel<string>('query', { required: true })
const selectedCategory = defineModel<string>('selectedCategory', { required: true })
const selectedTag = defineModel<string>('selectedTag', { required: true })
const selectedYear = defineModel<string>('selectedYear', { required: true })
const featuredOnly = defineModel<boolean>('featuredOnly', { required: true })
const sort = defineModel<string>('sort', { required: true })

const emit = defineEmits<{
  reset: []
}>()
</script>

<template>
  <aside
    class="vt-work-index-desktop-stitch-rail"
    data-vt-ui21a-work-index-desktop-stitch-rail="true"
    aria-labelledby="work-index-desktop-stitch-rail-heading"
  >
    <header class="vt-work-index-desktop-stitch-rail__header">
      <p class="vt-work-index-desktop-stitch-rail__eyebrow">Control</p>
      <h2 id="work-index-desktop-stitch-rail-heading">탐색</h2>
    </header>

    <ContentSearchPanel
      v-model:query="query"
      v-model:selected-category="selectedCategory"
      v-model:selected-tag="selectedTag"
      v-model:selected-year="selectedYear"
      v-model:featured-only="featuredOnly"
      v-model:sort="sort"
      surface="desktop-stitch"
      :category-options="props.categoryOptions"
      :tag-options="props.tagOptions"
      :year-options="props.yearOptions"
      :result-count="props.resultCount"
      :total-count="props.totalCount"
      @reset="emit('reset')"
    />
  </aside>
</template>

<style scoped>
.vt-work-index-desktop-stitch-rail {
  display: none;
}

@media (min-width: 1120px) {
  .vt-work-index-desktop-stitch-rail {
    display: block;
    position: sticky;
    top: calc(var(--vt-header-height, 72px) + 1.25rem);
    align-self: start;
    max-height: calc(100vh - 6rem);
    overflow-y: auto;
    padding: 0.95rem;
    border-radius: 1.2rem;
    border: 1px dashed color-mix(in srgb, currentColor 18%, transparent);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.68));
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.56),
      0 18px 42px rgba(15, 23, 42, 0.08);
    backdrop-filter: blur(12px);
  }

  .vt-work-index-desktop-stitch-rail::before {
    content: '';
    position: absolute;
    inset: 0.45rem;
    border: 1px dashed color-mix(in srgb, currentColor 14%, transparent);
    border-radius: 0.9rem;
    pointer-events: none;
  }

  .vt-work-index-desktop-stitch-rail__header {
    position: relative;
    z-index: 1;
    margin: 0 0 0.8rem;
  }

  .vt-work-index-desktop-stitch-rail__eyebrow {
    margin: 0 0 0.2rem;
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, currentColor 52%, transparent);
  }

  .vt-work-index-desktop-stitch-rail__header h2 {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.2;
  }
}
</style>

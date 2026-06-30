<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ContentSearchPanel from '@/components/content/ContentSearchPanel.vue'

type CategoryOption = { value: string; label: string; count: number }
type FacetOption = { value: string; count: number }

const props = withDefaults(
  defineProps<{
    categoryOptions: readonly CategoryOption[]
    tagOptions: readonly FacetOption[]
    yearOptions: readonly FacetOption[]
    resultCount: number
    totalCount: number
    anchorSelector?: string
  }>(),
  {
    anchorSelector: '.vt-work-index-main',
  },
)

const query = defineModel<string>('query', { required: true })
const selectedCategory = defineModel<string>('selectedCategory', { required: true })
const selectedTag = defineModel<string>('selectedTag', { required: true })
const selectedYear = defineModel<string>('selectedYear', { required: true })
const featuredOnly = defineModel<boolean>('featuredOnly', { required: true })
const sort = defineModel<string>('sort', { required: true })

const emit = defineEmits<{
  reset: []
}>()

const DESKTOP_QUERY = '(min-width: 1120px)'
const RAIL_WIDTH_PX = 224
const RAIL_GAP_PX = 24
const RAIL_MIN_GUTTER_PX = 24
const RAIL_BOTTOM_GUTTER_PX = 24
const HEADER_FALLBACK_PX = 72
const HEADER_GAP_PX = 20

const railStyle = ref<Record<string, string>>({})
const isRailPositioned = ref(false)
const railPlacementReceipt = computed(() => (
  isRailPositioned.value ? 'page-side-scroll-anchor' : 'hidden-no-side-room'
))

let mediaQuery: MediaQueryList | null = null
let cleanupMediaQuery: (() => void) | null = null
let frameId: number | null = null
let resizeObserver: ResizeObserver | null = null

function readHeaderHeightPx() {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--vt-header-height')
    .trim()
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : HEADER_FALLBACK_PX
}

function syncRailPosition() {
  const isDesktop = mediaQuery?.matches ?? window.matchMedia(DESKTOP_QUERY).matches

  if (!isDesktop) {
    isRailPositioned.value = false
    railStyle.value = {}
    return
  }

  const anchor = document.querySelector<HTMLElement>(props.anchorSelector)
  if (!anchor) {
    isRailPositioned.value = false
    railStyle.value = {}
    return
  }

  const anchorRect = anchor.getBoundingClientRect()
  const headerTop = Math.round(readHeaderHeightPx() + HEADER_GAP_PX)
  const left = Math.round(anchorRect.left - RAIL_WIDTH_PX - RAIL_GAP_PX)

  if (left < RAIL_MIN_GUTTER_PX) {
    isRailPositioned.value = false
    railStyle.value = {}
    return
  }

  isRailPositioned.value = true
  railStyle.value = {
    position: 'fixed',
    top: `${headerTop}px`,
    left: `${left}px`,
    width: `${RAIL_WIDTH_PX}px`,
    maxHeight: `calc(100vh - ${headerTop + RAIL_BOTTOM_GUTTER_PX}px)`,
  }
}

function scheduleRailSync() {
  if (frameId !== null) return

  frameId = window.requestAnimationFrame(() => {
    frameId = null
    syncRailPosition()
  })
}

function attachAnchorResizeObserver() {
  if (!('ResizeObserver' in window)) return

  const anchor = document.querySelector<HTMLElement>(props.anchorSelector)
  if (!anchor) return

  resizeObserver = new ResizeObserver(() => scheduleRailSync())
  resizeObserver.observe(anchor)
}

onMounted(() => {
  mediaQuery = window.matchMedia(DESKTOP_QUERY)

  const handleMediaQueryChange = () => scheduleRailSync()
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleMediaQueryChange)
    cleanupMediaQuery = () => mediaQuery?.removeEventListener('change', handleMediaQueryChange)
  } else {
    mediaQuery.addListener(handleMediaQueryChange)
    cleanupMediaQuery = () => mediaQuery?.removeListener(handleMediaQueryChange)
  }

  window.addEventListener('scroll', scheduleRailSync, { passive: true })
  window.addEventListener('resize', scheduleRailSync, { passive: true })
  attachAnchorResizeObserver()
  scheduleRailSync()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleRailSync)
  window.removeEventListener('resize', scheduleRailSync)
  cleanupMediaQuery?.()
  cleanupMediaQuery = null
  resizeObserver?.disconnect()
  resizeObserver = null

  if (frameId !== null) {
    window.cancelAnimationFrame(frameId)
    frameId = null
  }
})
</script>

<template>
  <aside
    v-show="isRailPositioned"
    class="vt-work-index-desktop-stitch-rail"
    :style="railStyle"
    :data-vt-ui21a-work-index-desktop-stitch-rail="railPlacementReceipt"
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
    z-index: 18;
    overflow-y: auto;
    box-sizing: border-box;
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

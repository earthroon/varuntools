<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import MarkdownLightbox from '@/components/markdown/MarkdownLightbox.vue'
import MarkdownToc from '@/components/markdown/MarkdownToc.vue'
import WorkDetailFooter from '@/components/works/WorkDetailFooter.vue'
import WorkPager from '@/components/works/WorkPager.vue'
import { useActiveHeading } from '@/composables/useActiveHeading'
import { useObservedHeadings } from '@/composables/useObservedHeadings'
import { useSectionLightbox } from '@/composables/useSectionLightbox'
import { mountImageMagnifier } from '@/composables/useImageMagnifier'
import { usePageMeta } from '@/composables/usePageMeta'
import { useMarkdownInternalLinks } from '@/composables/useMarkdownInternalLinks'
import { useMarkdownComponentMount } from '@/markdown/useMarkdownComponentMount'
import { createPageMeta } from '@/metadata/pageMeta'
import { getWorkDetailContext } from '@/markdown/pageRegistry'
import { resolvePublicExposure } from '@/content/exposureTaxonomy'
import { getPublicContentEntries } from '@/composables/usePublicContentCollection'
import { getAdjacentPublicContentEntries } from '@/utils/getAdjacentPublicContentEntries'
import type { LoadedMarkdownPage } from '@/markdown/types'

const props = withDefaults(
  defineProps<{
    page: LoadedMarkdownPage | null
    pages?: LoadedMarkdownPage[]
    showToc?: boolean
    showRelatedFooter?: boolean
    pageShell?: 'default' | 'compact'
    notFoundTitle?: string
    notFoundMessage?: string
  }>(),
  {
    pages: () => [],
    showToc: true,
    showRelatedFooter: true,
    pageShell: 'default',
    notFoundTitle: '페이지를 찾을 수 없습니다',
    notFoundMessage: '요청한 문서가 아직 등록되지 않았습니다.',
  },
)

const markdownRoot = ref<HTMLElement | null>(null)
useMarkdownInternalLinks(markdownRoot)
let cleanupImageMagnifier: (() => void) | null = null

const pageRef = computed(() => props.page)
const pagesRef = computed(() => props.pages || [])
const compiledHeadings = computed(() => props.page?.headings || [])
const { observedHeadings, refreshObservedHeadings } = useObservedHeadings(markdownRoot)
const headings = computed(() =>
  observedHeadings.value.length > 0 ? observedHeadings.value : compiledHeadings.value,
)

const { activeHeadingId, refreshActiveHeading } = useActiveHeading(
  markdownRoot,
  headings,
)

const {
  items: lightboxItems,
  activeIndex: lightboxActiveIndex,
  activeItem: lightboxActiveItem,
  isOpen: lightboxOpen,
  close: closeLightbox,
  previous: previousLightbox,
  next: nextLightbox,
  setIndex: setLightboxIndex,
  mount: mountLightbox,
  unmount: unmountLightbox,
} = useSectionLightbox(markdownRoot)

useMarkdownComponentMount({
  root: markdownRoot,
  page: pageRef,
  pages: pagesRef,
  onMounted: async () => {
    unmountLightbox()
    await refreshObservedHeadings()
    await refreshActiveHeading()
    const autoMiniGallery = (props.page?.frontmatter as any)?.gallery?.autoMini !== false
    mountLightbox({ miniGallery: autoMiniGallery })
    cleanupImageMagnifier?.()
    if (markdownRoot.value) {
      cleanupImageMagnifier = mountImageMagnifier({ root: markdownRoot.value })
    }
  },
})

const pageMeta = computed(() => {
  if (!props.page) return null
  return createPageMeta(props.page)
})

usePageMeta(pageMeta)

const shouldUseWorkDetailFooter = computed(() => {
  if (!props.showRelatedFooter || !props.page || !pagesRef.value.length) return false
  const exposure = resolvePublicExposure(props.page)
  return (
    exposure.category === 'work' ||
    exposure.category === 'case-study' ||
    exposure.kind === 'work' ||
    exposure.kind === 'case-study' ||
    props.page.slug.startsWith('works/')
  )
})

const workDetailContext = computed(() => {
  if (!shouldUseWorkDetailFooter.value || !props.page) return null
  return getWorkDetailContext(pagesRef.value, props.page.slug)
})

const publicContentAdjacent = computed(() => {
  if (!props.showRelatedFooter || !props.page || !pagesRef.value.length) {
    return { previous: null, next: null }
  }

  const entries = getPublicContentEntries(pagesRef.value, { scope: 'index' })
  return getAdjacentPublicContentEntries(entries, props.page.slug)
})

const shouldShowPublicContentAdjacentPager = computed(() => Boolean(
  props.showRelatedFooter &&
  props.page &&
  (publicContentAdjacent.value.previous || publicContentAdjacent.value.next) &&
  !(workDetailContext.value?.previous || workDetailContext.value?.next),
))

onBeforeUnmount(() => {
  cleanupImageMagnifier?.()
  cleanupImageMagnifier = null
})

const shouldShowToc = computed(() => props.showToc && headings.value.length > 0)

const articleClass = computed(() => [
  'vt-markdown-page',
  'theme-showroom',
  props.pageShell === 'compact' ? 'vt-markdown-page--compact' : '',
])
</script>

<template>
  <article :class="articleClass">
    <MarkdownToc
      v-if="page && shouldShowToc"
      :headings="headings"
      :active-heading-id="activeHeadingId"
    />

    <div
      v-if="page"
      ref="markdownRoot"
      class="vt-markdown"
      v-html="page.html"
    />

    <div v-else class="vt-markdown vt-markdown-not-found">
      <h1>{{ notFoundTitle }}</h1>
      <p>{{ notFoundMessage }}</p>
    </div>

    <WorkDetailFooter
      v-if="page && workDetailContext"
      :context="workDetailContext"
    />

    <footer
      v-if="page && shouldShowPublicContentAdjacentPager"
      class="vt-work-detail-footer vt-work-detail-footer--public-adjacent"
      data-vt-ui23r3-public-content-adjacent-footer="1"
    >
      <WorkPager
        data-vt-ui23r3-public-content-adjacent-pager="1"
        :previous="publicContentAdjacent.previous"
        :next="publicContentAdjacent.next"
      />
    </footer>

    <MarkdownLightbox
      :open="lightboxOpen"
      :item="lightboxActiveItem"
      :count="lightboxItems.length"
      :index="lightboxActiveIndex"
      @close="closeLightbox"
      @previous="previousLightbox"
      :items="lightboxItems"
      @next="nextLightbox"
      @set-index="setLightboxIndex"
    />
  </article>
</template>

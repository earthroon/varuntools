<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import WorksTagLanding from '@/components/works/WorksTagLanding.vue'
import { useRouteManifest } from '@/composables/useRouteManifest'
import { usePageMeta } from '@/composables/usePageMeta'
import { getWorkCollectionEntries } from '@/markdown/pageRegistry'
import { resolvePageSeo } from '@/site/seo'
import tagIndex from '@/content/generated/portfolio-tag-index.json'

const route = useRoute()
const { pages } = useRouteManifest()

const tagSlug = computed(() => String(route.params.tag || '').trim())
const tagEntry = computed(() => {
  const decoded = decodeURIComponent(tagSlug.value)
  return tagIndex.tags.find((entry) => entry.slug === tagSlug.value || entry.slug === decoded) || null
})

const works = computed(() => {
  if (!tagEntry.value) return []
  const wanted = new Set(tagEntry.value.works)
  return getWorkCollectionEntries(pages).filter((entry) => wanted.has(entry.slug))
})

const fallbackTag = computed(() => ({
  tag: decodeURIComponent(tagSlug.value || 'tag'),
  slug: tagSlug.value || 'tag',
  href: `/works/tags/${tagSlug.value || 'tag'}`,
  count: 0,
  title: `${decodeURIComponent(tagSlug.value || '태그')} 작업`,
  description: '해당 태그의 작업이 없습니다.',
}))

const activeTag = computed(() => tagEntry.value || fallbackTag.value)

const pageMeta = computed(() => {
  const seo = resolvePageSeo({
    title: activeTag.value.title,
    description: activeTag.value.description,
    routePath: `/works/tags/${activeTag.value.slug}`,
    kind: 'tag',
  })

  return {
    title: seo.fullTitle,
    description: seo.description,
    canonicalUrl: seo.canonicalUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
    ogImage: seo.ogImageUrl,
    ogType: seo.ogType,
    twitterCard: seo.twitterCard,
    robots: tagEntry.value ? seo.robots : 'noindex,follow',
  }
})

usePageMeta(pageMeta)
</script>

<template>
  <article class="vt-markdown-page theme-showroom">
    <WorksTagLanding :tag="activeTag" :works="works" />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GeneratedPageRenderer from '@/components/generated/GeneratedPageRenderer.vue'
import { findGeneratedPageById, findGeneratedPageBySlug } from '@/lib/generated-content/findGeneratedPage'
import { getGeneratedPageContentDir } from '@/lib/generated-content/resolveGeneratedAssetSrc'
import { usePageMeta } from '@/composables/usePageMeta'
import { resolvePageSeo } from '@/site/seo'

const route = useRoute()

const page = computed(() => {
  const id = String(route.meta.generatedPageId || '').trim()
  if (id) return findGeneratedPageById(id)

  const slug = Array.isArray(route.params.slug)
    ? route.params.slug.join('/')
    : String(route.params.slug || route.path || '').replace(/^\/+/, '')
  return findGeneratedPageBySlug(slug)
})

const pageMeta = computed(() => {
  if (!page.value) return null
  const seo = resolvePageSeo({
    title: page.value.title,
    description: page.value.desc,
    summary: page.value.desc,
    routePath: `/${page.value.slug}`,
    contentDir: getGeneratedPageContentDir(page.value),
    cover: page.value.cover?.src,
    kind: page.value.type,
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
    robots: seo.robots,
  }
})

usePageMeta(pageMeta)
</script>

<template>
  <GeneratedPageRenderer
    v-if="page"
    :page="page"
  />

  <article v-else class="vt-markdown-page theme-showroom">
    <div class="vt-markdown vt-markdown-not-found">
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>요청한 generated page가 아직 등록되지 않았습니다.</p>
    </div>
  </article>
</template>

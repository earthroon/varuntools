<script setup lang="ts">
import { computed } from 'vue'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { resolveContentAssetMeta } from '@/markdown/resolveContentAssets'
import ProductCard from './ProductCard.vue'

type ProductCardProduct = {
  type?: string
  status?: string
  sku?: string
  price?: number | string
  currency?: string
  priceVisible?: boolean
  checkoutUrl?: string
  externalStoreUrl?: string
  inquiryUrl?: string
  checkoutProvider?: string
  showWhenUnavailable?: boolean
}

type ProductCardItem = {
  title: string
  description?: string
  href: string
  thumbnail?: string
  tags?: string[]
  contentDir?: string
  product?: ProductCardProduct
}

export type HomeSectionLayout = 'product-grid' | 'card-grid' | 'compact-list'
export type HomeSectionSource = 'products' | 'works' | 'tools' | 'lab' | 'all'
export type HomeSectionEmptyMode = 'notice' | 'hide'

type CardItem = ProductCardItem & {
  category: string
  order: number
  featured: boolean
  draft?: boolean
  hidden?: boolean
}

const props = withDefaults(
  defineProps<{
    pages?: LoadedMarkdownPage[]
    title?: string
    source?: HomeSectionSource | string
    featured?: boolean
    limit?: number
    layout?: HomeSectionLayout | string
    status?: string
    tags?: string[]
    showUnavailable?: boolean
    emptyMode?: HomeSectionEmptyMode | string
    emptyTitle?: string
    emptyBody?: string
    emptyHref?: string
    emptyLabel?: string
  }>(),
  {
    pages: () => [],
    title: '',
    source: 'all',
    featured: false,
    limit: 6,
    layout: 'card-grid',
    status: '',
    tags: () => [],
    showUnavailable: false,
    emptyMode: 'notice',
    emptyTitle: '아직 표시할 항목이 없습니다.',
    emptyBody: '',
    emptyHref: '',
    emptyLabel: '',
  },
)

function categoryOf(page: LoadedMarkdownPage): string {
  if (page.slug.startsWith('products/')) return 'products'
  if (page.slug.startsWith('tools/') || page.frontmatter.kind === 'tool') return 'tools'
  if (page.slug.startsWith('lab/') || page.frontmatter.kind === 'lab') return 'lab'
  if (page.slug.startsWith('works/') || page.frontmatter.kind === 'work') return 'works'
  return page.frontmatter.kind || 'page'
}

function hrefOf(page: LoadedMarkdownPage) {
  return page.slug === 'home' ? '/' : `/${page.slug}`
}

function isHidden(page: LoadedMarkdownPage) {
  return (
    page.frontmatter.draft === true ||
    page.frontmatter.visibility === 'hidden' ||
    page.frontmatter.status === 'archived' ||
    page.frontmatter.product?.status === 'hidden' ||
    page.frontmatter.product?.status === 'draft'
  )
}

function isUnavailableProduct(page: LoadedMarkdownPage) {
  const status = page.frontmatter.product?.status
  return status === 'coming-soon' || status === 'sold-out'
}

function pageToItem(page: LoadedMarkdownPage): CardItem {
  const fm = page.frontmatter
  const category = categoryOf(page)
  return {
    href: hrefOf(page),
    category,
    title: fm.cardTitle || fm.title || page.slug,
    description: fm.cardDescription || fm.summary || fm.description || '',
    thumbnail: fm.cardCover || fm.thumbnail || fm.cover || fm.ogImage || '',
    tags: fm.tags || [],
    contentDir: page.contentDir,
    order: typeof fm.order === 'number' ? fm.order : 9999,
    featured: fm.featured === true,
    draft: fm.draft === true,
    hidden: fm.visibility === 'hidden',
    product: fm.product,
  }
}

const normalizedTags = computed(() => props.tags.map((tag) => tag.trim()).filter(Boolean))

const items = computed(() => {
  const source = (props.source || 'all').trim()
  const limit = Math.max(1, Math.min(24, Math.floor(props.limit || 6)))

  return props.pages
    .filter((page) => {
      if (page.slug === 'home' || page.slug === 'products' || page.slug === 'docs/works') return false
      if (isHidden(page)) return false

      const category = categoryOf(page)
      if (source !== 'all' && category !== source) return false
      if (props.featured && page.frontmatter.featured !== true) return false

      if (category === 'products') {
        if (!page.frontmatter.product) return false
        if (props.status && page.frontmatter.product.status !== props.status) return false
        if (isUnavailableProduct(page) && !props.showUnavailable && !page.frontmatter.product.showWhenUnavailable) return false
      }

      if (normalizedTags.value.length) {
        const pageTags = page.frontmatter.tags || []
        if (!normalizedTags.value.every((tag) => pageTags.includes(tag))) return false
      }

      return true
    })
    .map(pageToItem)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
    .slice(0, limit)
})

const layout = computed<HomeSectionLayout>(() => {
  return props.layout === 'product-grid' || props.layout === 'compact-list' ? props.layout : 'card-grid'
})

const emptyMode = computed<HomeSectionEmptyMode>(() => (props.emptyMode === 'hide' ? 'hide' : 'notice'))
const shouldRenderSection = computed(() => items.value.length > 0 || emptyMode.value !== 'hide')
const hasEmptyAction = computed(() => Boolean(props.emptyHref && props.emptyLabel))

function thumbnailUrl(item: CardItem) {
  if (!item.thumbnail) return ''
  const asset = resolveContentAssetMeta(item.contentDir || '', item.thumbnail)
  return asset.found ? asset.url : item.thumbnail
}
</script>

<template>
  <section
    v-if="shouldRenderSection"
    class="vt-home-section"
    :data-layout="layout"
    :data-source="source"
    :data-empty="items.length ? 'false' : 'true'"
  >
    <header class="vt-home-section__header">
      <h2 class="vt-home-section__title">{{ title }}</h2>
    </header>

    <div v-if="items.length" class="vt-home-section__grid">
      <template v-if="layout === 'product-grid'">
        <ProductCard
          v-for="item in items"
          :key="item.href"
          :item="item"
        />
      </template>

      <template v-else>
        <a
          v-for="item in items"
          :key="item.href"
          class="vt-home-card"
          :href="item.href"
        >
          <span class="vt-home-card__thumb" aria-hidden="true">
            <img
              v-if="thumbnailUrl(item)"
              :src="thumbnailUrl(item)"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <span v-else class="vt-home-card__fallback">▦</span>
          </span>
          <span class="vt-home-card__body">
            <strong class="vt-home-card__title">{{ item.title }}</strong>
            <span v-if="item.description" class="vt-home-card__description">{{ item.description }}</span>
            <span class="vt-home-card__meta">{{ item.category }}</span>
          </span>
        </a>
      </template>
    </div>

    <article v-else class="vt-home-section__empty-card" aria-live="polite">
      <strong class="vt-home-section__empty-title">{{ emptyTitle }}</strong>
      <p v-if="emptyBody" class="vt-home-section__empty-body">{{ emptyBody }}</p>
      <a v-if="hasEmptyAction" class="vt-home-section__empty-link" :href="emptyHref">
        {{ emptyLabel }}
      </a>
    </article>
  </section>
</template>

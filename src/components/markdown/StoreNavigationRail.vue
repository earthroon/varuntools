<script setup lang="ts">
import { computed } from 'vue'
import type { LoadedMarkdownPage } from '@/markdown/types'
import { getProductCatalogEntries, getProductCategoryFacetCounts, getProductCollectionFacetCounts, type ProductFacetCount } from '@/utils/productCatalog'
const props = withDefaults(defineProps<{ pages?: LoadedMarkdownPage[]; title?: string; intro?: string; mode?: 'categories' | 'collections' | 'mixed'; currentCategory?: string; currentCollection?: string; showCounts?: boolean; showEmpty?: boolean; includeAllLink?: boolean; allHref?: string; categoriesHrefBase?: string; collectionsHrefBase?: string; emptyLabel?: string }>(), { pages: () => [], title: 'Store Navigation', intro: '', mode: 'categories', currentCategory: '', currentCollection: '', showCounts: true, showEmpty: false, includeAllLink: true, allHref: '/products', categoriesHrefBase: '/products/categories', collectionsHrefBase: '/products/collections', emptyLabel: '준비 중' })
const entries = computed(() => getProductCatalogEntries(props.pages)); const allCount = computed(() => entries.value.length)
const categoryItems = computed(() => getProductCategoryFacetCounts(props.pages, { currentCategory: props.currentCategory, showEmpty: props.showEmpty, hrefBase: props.categoriesHrefBase }))
const collectionItems = computed(() => getProductCollectionFacetCounts(props.pages, { currentCollection: props.currentCollection, showEmpty: props.showEmpty, hrefBase: props.collectionsHrefBase }))
const showCategories = computed(() => props.mode === 'categories' || props.mode === 'mixed'); const showCollections = computed(() => props.mode === 'collections' || props.mode === 'mixed'); const allIsCurrent = computed(() => props.currentCategory === 'all' && !props.currentCollection)
function countText(count: number): string { return count === 1 ? '1 item' : `${count} items` }
function itemClass(item: ProductFacetCount): Record<string, boolean> { return { 'vt-store-nav__link': true, 'vt-store-nav__link--current': item.current, 'vt-store-nav__link--disabled': item.disabled } }
</script>
<template>
  <nav class="vt-store-nav" aria-label="Store categories">
    <header class="vt-store-nav__header"><h2 class="vt-store-nav__title">{{ title }}</h2><p v-if="intro" class="vt-store-nav__intro">{{ intro }}</p></header>
    <div class="vt-store-nav__groups">
      <section v-if="includeAllLink" class="vt-store-nav__group" aria-label="All products"><a class="vt-store-nav__all" :href="allHref" :aria-current="allIsCurrent ? 'page' : undefined"><span>전체 상품</span><span v-if="showCounts" class="vt-store-nav__count">{{ countText(allCount) }}</span></a></section>
      <section v-if="showCategories" class="vt-store-nav__group" aria-label="Product categories"><h3 class="vt-store-nav__group-title">카테고리</h3><ul class="vt-store-nav__list"><li v-for="item in categoryItems" :key="item.id" class="vt-store-nav__item"><a v-if="!item.disabled" :class="itemClass(item)" :href="item.href" :aria-current="item.current ? 'page' : undefined"><span class="vt-store-nav__label">{{ item.label }}</span><span v-if="showCounts" class="vt-store-nav__count">{{ countText(item.count) }}</span></a><span v-else :class="itemClass(item)" aria-disabled="true"><span class="vt-store-nav__label">{{ item.label }}</span><span class="vt-store-nav__empty">{{ emptyLabel }}</span></span><small v-if="item.description" class="vt-store-nav__description">{{ item.description }}</small></li></ul></section>
      <section v-if="showCollections" class="vt-store-nav__group" aria-label="Product collections"><h3 class="vt-store-nav__group-title">컬렉션</h3><ul class="vt-store-nav__list"><li v-for="item in collectionItems" :key="item.id" class="vt-store-nav__item"><a v-if="!item.disabled" :class="itemClass(item)" :href="item.href" :aria-current="item.current ? 'page' : undefined"><span class="vt-store-nav__label">{{ item.label }}</span><span v-if="showCounts" class="vt-store-nav__count">{{ countText(item.count) }}</span></a><span v-else :class="itemClass(item)" aria-disabled="true"><span class="vt-store-nav__label">{{ item.label }}</span><span class="vt-store-nav__empty">{{ emptyLabel }}</span></span><small v-if="item.description" class="vt-store-nav__description">{{ item.description }}</small></li></ul></section>
    </div>
  </nav>
</template>

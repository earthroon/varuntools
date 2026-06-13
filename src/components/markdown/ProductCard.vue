<script setup lang="ts">
import { computed } from 'vue'
import { resolveContentAssetMeta } from '@/markdown/resolveContentAssets'
import {
  formatProductPrice,
  formatProductStatus,
  formatProductType,
} from '@/utils/formatProduct'
import { resolveProductAction } from '@/utils/productAction'

type ProductCardProduct = {
  type?: string
  status?: string
  sku?: string
  price?: number | string
  currency?: string
  priceVisible?: boolean
  checkoutProvider?: string
  checkoutMode?: string
  checkoutUrl?: string
  successUrl?: string
  failUrl?: string
  claimRedirect?: string
  externalStoreUrl?: string
  externalUrl?: string
  inquiryUrl?: string
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

const props = defineProps<{
  item: ProductCardItem
}>()

const product = computed(() => props.item.product || {})
const status = computed(() => product.value.status || 'coming-soon')
const typeLabel = computed(() => formatProductType(product.value.type))
const statusLabel = computed(() => formatProductStatus(status.value))
const priceLabel = computed(() =>
  formatProductPrice({
    price: product.value.price,
    currency: product.value.currency,
    priceVisible: product.value.priceVisible,
  }),
)

const thumbnailUrl = computed(() => {
  if (!props.item.thumbnail) return ''
  const asset = resolveContentAssetMeta(props.item.contentDir || '', props.item.thumbnail)
  return asset.found ? asset.url : props.item.thumbnail
})

const primaryAction = computed(() =>
  resolveProductAction(product.value, {
    context: 'card',
    detailHref: props.item.href,
  }),
)

</script>

<template>
  <article class="vt-product-card" :data-status="status">
    <a class="vt-product-card__thumb" :href="item.href" aria-hidden="true" tabindex="-1">
      <img
        v-if="thumbnailUrl"
        :src="thumbnailUrl"
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span v-else class="vt-product-card__fallback" aria-hidden="true">▦</span>
    </a>

    <div class="vt-product-card__badges" aria-label="상품 상태">
      <span class="vt-product-card__badge" :data-status="status">{{ statusLabel }}</span>
      <span class="vt-product-card__badge" data-type>{{ typeLabel }}</span>
    </div>

    <div class="vt-product-card__body">
      <h3 class="vt-product-card__title">
        <a :href="item.href">{{ item.title }}</a>
      </h3>
      <p v-if="item.description" class="vt-product-card__description">
        {{ item.description }}
      </p>
      <p v-if="priceLabel" class="vt-product-card__price">{{ priceLabel }}</p>
    </div>

    <div class="vt-product-card__actions">
      <a class="vt-product-card__button" :href="item.href">보기</a>
      <a
        v-if="!primaryAction.disabled"
        class="vt-product-card__button vt-product-card__button--primary"
        :href="primaryAction.href"
        :target="primaryAction.external ? '_blank' : undefined"
        :rel="primaryAction.external ? 'noopener noreferrer' : undefined"
      >
        {{ primaryAction.label }}
      </a>
      <button
        v-else
        class="vt-product-card__button vt-product-card__button--disabled"
        type="button"
        disabled
      >
        {{ primaryAction.label }}
      </button>
    </div>
  </article>
</template>

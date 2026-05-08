<script setup lang="ts">
import { computed } from 'vue'
import type { ProductFrontmatter } from '@/types/content'
import { formatProductPrice, formatProductStatus, formatProductType } from '@/utils/formatProduct'
import { resolveProductAction } from '@/utils/productAction'
import ProductVariantSelector from './ProductVariantSelector.vue'

const props = defineProps<{
  title: string
  description?: string
  href: string
  product?: ProductFrontmatter | null
}>()

const product = computed(() => props.product || null)
const action = computed(() => resolveProductAction(product.value || {}, { context: 'detail', detailHref: props.href }))
const status = computed(() => product.value?.status || 'coming-soon')
const typeLabel = computed(() => formatProductType(product.value?.type))
const statusLabel = computed(() => formatProductStatus(status.value))
const priceLabel = computed(() => formatProductPrice({
  price: product.value?.price,
  currency: product.value?.currency,
  priceVisible: product.value?.priceVisible,
}))
const hasVariants = computed(() => Boolean(product.value?.hasVariants && product.value?.variants?.length))

const metaItems = computed(() => {
  if (!product.value) return []
  const items: Array<{ label: string; value: string }> = [
    { label: 'Status', value: statusLabel.value },
    { label: 'Type', value: typeLabel.value },
  ]
  if (product.value.sku) items.push({ label: 'SKU', value: String(product.value.sku) })
  if (product.value.series) items.push({ label: 'Series', value: String(product.value.series) })
  if (product.value.collection) items.push({ label: 'Collection', value: String(product.value.collection) })
  if (product.value.license) items.push({ label: 'License', value: String(product.value.license) })
  if (product.value.material) items.push({ label: 'Material', value: String(product.value.material) })
  if (product.value.size) items.push({ label: 'Size', value: String(product.value.size) })
  if (product.value.releaseDate) items.push({ label: 'Release', value: String(product.value.releaseDate) })
  if (product.value.stock !== undefined && product.value.stock !== '') items.push({ label: 'Stock', value: String(product.value.stock) })
  if (product.value.shippingRequired !== undefined) items.push({ label: 'Shipping', value: product.value.shippingRequired ? 'Required' : 'Not required' })
  if (action.value.checkoutProvider) items.push({ label: 'Checkout provider', value: action.value.checkoutProvider })
  if (action.value.checkoutMode) items.push({ label: 'Checkout mode', value: action.value.checkoutMode })
  if (action.value.claimRedirect) items.push({ label: 'Claim guide', value: action.value.claimRedirect })
  if (product.value.downloadProvider && product.value.type === 'digital') items.push({ label: 'Download', value: String(product.value.downloadProvider) })
  return items
})
</script>

<template>
  <aside
    class="vt-product-detail-cta"
    :data-tone="product ? action.tone : 'warning'"
    :data-kind="product ? action.kind : 'missing-product'"
    :data-checkout-mode="product ? action.checkoutMode : 'missing-product'"
    aria-label="Product purchase state"
  >
    <div class="vt-product-detail-cta__header">
      <p class="vt-product-detail-cta__eyebrow">Product action</p>
      <h2 class="vt-product-detail-cta__title">{{ product ? action.title : 'Missing product metadata' }}</h2>
      <p class="vt-product-detail-cta__body">
        {{ product ? action.body : '::product-cta requires product frontmatter on a product detail page.' }}
      </p>
    </div>

    <dl v-if="product" class="vt-product-detail-cta__meta">
      <div v-for="item in metaItems" :key="item.label" class="vt-product-detail-cta__meta-item">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </div>
    </dl>

    <section v-if="product" class="vt-product-detail-cta__handoff" aria-label="Checkout handoff boundary">
      <p class="vt-product-detail-cta__handoff-title">Checkout handoff: {{ action.checkoutMode || 'disabled' }}</p>
      <p v-if="action.claimRedirect" class="vt-product-detail-cta__handoff-copy">
        After payment, guide buyers to {{ action.claimRedirect }} for delivery instructions.
      </p>
      <p class="vt-product-detail-cta__trust-boundary">{{ action.trustBoundaryNotice }}</p>
    </section>

    <ProductVariantSelector v-if="hasVariants" :product="product" title="Choose purchase scope" />

    <p v-if="priceLabel && !hasVariants" class="vt-product-detail-cta__price">{{ priceLabel }}</p>

    <div v-if="!hasVariants" class="vt-product-detail-cta__actions">
      <a
        v-if="product && !action.disabled"
        class="vt-product-detail-cta__button vt-product-detail-cta__button--primary"
        :href="action.href"
        :target="action.external ? '_blank' : undefined"
        :rel="action.external ? 'noopener noreferrer' : undefined"
      >
        {{ action.label }}
      </a>
      <button v-else class="vt-product-detail-cta__button vt-product-detail-cta__button--disabled" type="button" disabled>
        {{ product ? action.label : 'CTA disabled' }}
      </button>
    </div>

    <p v-if="product && action.disabled" class="vt-product-detail-cta__notice">{{ action.reason }}</p>
  </aside>
</template>

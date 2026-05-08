<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import type { ProductFrontmatter } from '@/types/content'
import { formatProductPrice } from '@/utils/formatProduct'
import { getDefaultVariantId, getPublicProductVariants, isVariantPurchasable, publicVariantNotice } from '@/utils/productEntitlements'

const props = defineProps<{
  title?: string
  product?: ProductFrontmatter | null
  showPrice?: boolean
}>()

const variants = computed(() => getPublicProductVariants(props.product))
const selectedId = ref('')

watchEffect(() => {
  if (!selectedId.value && variants.value.length) selectedId.value = getDefaultVariantId(props.product)
})

const selected = computed(() => variants.value.find((variant) => variant.id === selectedId.value) || variants.value[0] || null)
const selectedPrice = computed(() => {
  if (!selected.value || props.showPrice === false) return ''
  return formatProductPrice({ price: selected.value.price, currency: selected.value.currency, priceVisible: true })
})
const purchasable = computed(() => Boolean(selected.value && isVariantPurchasable(selected.value)))
const notice = computed(() => publicVariantNotice())
</script>

<template>
  <section class="vt-product-variant-selector" aria-label="Product variant selection">
    <div class="vt-product-variant-selector__header">
      <p class="vt-product-variant-selector__eyebrow">Variant / entitlement</p>
      <h3>{{ title || 'Choose a license option' }}</h3>
      <p>{{ notice }}</p>
    </div>

    <div v-if="variants.length" class="vt-product-variant-selector__grid">
      <label
        v-for="variant in variants"
        :key="variant.id"
        class="vt-product-variant-selector__card"
        :data-selected="variant.id === selectedId"
        :data-status="variant.status"
      >
        <input v-model="selectedId" type="radio" name="product-variant" :value="variant.id" />
        <strong>{{ variant.label }}</strong>
        <span>{{ variant.licenseScope || 'license scope pending' }}</span>
        <span>{{ variant.status }}</span>
      </label>
    </div>

    <p v-else class="vt-product-variant-selector__empty">No public variants are configured for this product.</p>

    <div v-if="selected" class="vt-product-variant-selector__summary">
      <p v-if="selectedPrice" class="vt-product-variant-selector__price">{{ selectedPrice }}</p>
      <a
        v-if="purchasable"
        class="vt-product-variant-selector__button"
        :href="selected.checkoutUrl"
        :target="/^https?:\/\//i.test(selected.checkoutUrl || '') ? '_blank' : undefined"
        :rel="/^https?:\/\//i.test(selected.checkoutUrl || '') ? 'noopener noreferrer' : undefined"
      >
        Continue with {{ selected.label }}
      </a>
      <button v-else class="vt-product-variant-selector__button vt-product-variant-selector__button--disabled" type="button" disabled>
        Variant checkout pending
      </button>
    </div>
  </section>
</template>

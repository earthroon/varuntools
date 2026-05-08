<script setup lang="ts">
import { computed } from 'vue'
import type { ProductFrontmatter } from '@/types/content'
import { resolveProductSpecs } from '@/utils/productSpecs'

const props = defineProps<{
  title: string
  product?: ProductFrontmatter | null
}>()

const resolved = computed(() => resolveProductSpecs(props.product || null))
const hasProduct = computed(() => Boolean(props.product))
const hasSpecs = computed(() => {
  const data = resolved.value
  return Boolean(
    data.meta.length ||
    data.specs.length ||
    data.variants.length ||
    data.includedItems.length ||
    data.compatibility.length ||
    data.requirements.length ||
    data.delivery ||
    data.notes.length,
  )
})
</script>

<template>
  <section class="vt-product-specs" :data-state="hasProduct ? 'ready' : 'missing-product'" aria-label="상품 구성과 제공 조건">
    <header class="vt-product-specs__header">
      <p class="vt-product-specs__eyebrow">Product specs</p>
      <h2 class="vt-product-specs__title">구성 및 제공 조건</h2>
      <p class="vt-product-specs__intro">
        {{ hasProduct ? `${title}에서 실제로 받는 것과 옵션, 제공 조건을 확인합니다.` : '상품 정보가 없습니다.' }}
      </p>
    </header>

    <p v-if="!hasProduct" class="vt-product-specs__fallback">
      ::product-specs는 product frontmatter가 있는 상품 상세 페이지에서 사용해야 합니다.
    </p>
    <p v-else-if="!hasSpecs" class="vt-product-specs__fallback">
      아직 표시할 상품 스펙이 없습니다. product.specs, variants, includedItems, delivery 메타데이터를 추가하세요.
    </p>

    <div v-else class="vt-product-specs__grid">
      <article v-if="resolved.meta.length" class="vt-product-specs__card">
        <h3>기본 정보</h3>
        <dl>
          <div v-for="item in resolved.meta" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </article>

      <article v-if="resolved.specs.length" class="vt-product-specs__card">
        <h3>상세 스펙</h3>
        <dl>
          <div v-for="item in resolved.specs" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}<small v-if="item.note">{{ item.note }}</small></dd>
          </div>
        </dl>
      </article>

      <article v-if="resolved.variants.length" class="vt-product-specs__card">
        <h3>옵션</h3>
        <ul>
          <li v-for="variant in resolved.variants" :key="variant.id || variant.label">
            <strong>{{ variant.label }}</strong>
            <span v-if="variant.status">{{ variant.status }}</span>
            <small v-if="variant.note">{{ variant.note }}</small>
          </li>
        </ul>
      </article>

      <article v-if="resolved.includedItems.length" class="vt-product-specs__card">
        <h3>포함 구성</h3>
        <ul>
          <li v-for="item in resolved.includedItems" :key="item.label">
            <strong>{{ item.label }}</strong>
            <span v-if="item.quantity">× {{ item.quantity }}</span>
            <small v-if="item.note">{{ item.note }}</small>
          </li>
        </ul>
      </article>

      <article v-if="resolved.delivery" class="vt-product-specs__card">
        <h3>제공 방식</h3>
        <dl>
          <div v-if="resolved.delivery.method"><dt>Method</dt><dd>{{ resolved.delivery.method }}</dd></div>
          <div v-if="resolved.delivery.estimate"><dt>Estimate</dt><dd>{{ resolved.delivery.estimate }}</dd></div>
          <div v-if="resolved.delivery.format"><dt>Format</dt><dd>{{ resolved.delivery.format }}</dd></div>
          <div v-if="resolved.delivery.provider"><dt>Provider</dt><dd>{{ resolved.delivery.provider }}</dd></div>
          <div v-if="resolved.delivery.note"><dt>Note</dt><dd>{{ resolved.delivery.note }}</dd></div>
        </dl>
      </article>

      <article v-if="resolved.compatibility.length" class="vt-product-specs__card">
        <h3>호환성</h3>
        <ul><li v-for="item in resolved.compatibility" :key="item">{{ item }}</li></ul>
      </article>

      <article v-if="resolved.requirements.length" class="vt-product-specs__card">
        <h3>필요 조건</h3>
        <ul><li v-for="item in resolved.requirements" :key="item">{{ item }}</li></ul>
      </article>

      <article v-if="resolved.notes.length" class="vt-product-specs__card vt-product-specs__card--wide">
        <h3>운영 메모</h3>
        <dl>
          <div v-for="item in resolved.notes" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

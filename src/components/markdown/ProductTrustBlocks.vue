<script setup lang="ts">
import { computed } from 'vue'
import type { ProductFrontmatter } from '@/types/content'
import { resolveProductTrustBlocks } from '@/utils/productTrust'

const props = defineProps<{
  title: string
  product?: ProductFrontmatter | null
}>()

const blocks = computed(() => resolveProductTrustBlocks(props.product || null))
const hasProduct = computed(() => Boolean(props.product))
</script>

<template>
  <section
    class="vt-product-trust"
    :data-state="hasProduct ? 'ready' : 'missing-product'"
    aria-label="상품 구매 안내"
  >
    <header class="vt-product-trust__header">
      <p class="vt-product-trust__eyebrow">스토어 안내</p>
      <h2 class="vt-product-trust__title">구매 전 확인</h2>
      <p class="vt-product-trust__intro">
        {{ hasProduct ? `${title} 구매 전에 배송, 환불, 개인정보, 다운로드 안내를 확인합니다.` : '상품 정보가 없습니다.' }}
      </p>
    </header>

    <p v-if="!hasProduct" class="vt-product-trust__fallback">
      ::product-trust는 product frontmatter가 있는 상품 상세 페이지에서 사용해야 합니다.
    </p>

    <div v-else class="vt-product-trust__grid">
      <article
        v-for="block in blocks"
        :key="block.kind"
        class="vt-product-trust__card"
        :data-tone="block.tone"
      >
        <h3 class="vt-product-trust__card-title">{{ block.title }}</h3>
        <p class="vt-product-trust__card-body">{{ block.body }}</p>
        <a class="vt-product-trust__link" :href="block.href">
          {{ block.label }}
        </a>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CompareBlock, GeneratedPage } from '@/types/generatedContent'
import { resolveGeneratedAssetSrc } from '@/lib/generated-content/resolveGeneratedAssetSrc'

const props = defineProps<{
  page: GeneratedPage
  block: CompareBlock
}>()

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value))
}

const position = ref(clamp(Number(props.block.initial || 50)))

watch(
  () => props.block.initial,
  (next) => {
    position.value = clamp(Number(next || 50))
  },
)

const beforeSrc = computed(() => resolveGeneratedAssetSrc(props.page, props.block.before.src))
const afterSrc = computed(() => resolveGeneratedAssetSrc(props.page, props.block.after.src))
const beforeAlt = computed(() => props.block.before.alt || `${props.block.title || props.page.title} before`)
const afterAlt = computed(() => props.block.after.alt || `${props.block.title || props.page.title} after`)
const clipStyle = computed(() => ({ clipPath: `inset(0 ${100 - position.value}% 0 0)` }))
</script>

<template>
  <figure class="generated-block generated-compare" :data-block-id="block.id">
    <figcaption v-if="block.title" class="generated-block__title">{{ block.title }}</figcaption>

    <div class="generated-compare__stage">
      <img class="generated-compare__image" :src="afterSrc" :alt="afterAlt" loading="lazy" decoding="async" />
      <img class="generated-compare__image generated-compare__image--before" :style="clipStyle" :src="beforeSrc" :alt="beforeAlt" loading="lazy" decoding="async" />
      <input
        v-model.number="position"
        class="generated-compare__range"
        type="range"
        min="0"
        max="100"
        step="1"
        :aria-label="`${block.title || page.title} 전후 비교 슬라이더`"
      />
    </div>

    <p v-if="block.caption" class="generated-compare__caption">{{ block.caption }}</p>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GeneratedBlock, GeneratedPage } from '@/types/generatedContent'

import TextBlock from './blocks/TextBlock.vue'
import CalloutBlock from './blocks/CalloutBlock.vue'
import CompareBlock from './blocks/CompareBlock.vue'
import ImageBlock from './blocks/ImageBlock.vue'
import CtaBlock from './blocks/CtaBlock.vue'
import FaqBlock from './blocks/FaqBlock.vue'

const props = defineProps<{
  page: GeneratedPage
  block: GeneratedBlock
}>()

const isDev = import.meta.env.DEV

const unknownKind = computed(() => {
  return String((props.block as { kind?: string }).kind ?? 'unknown')
})
</script>

<template>
  <TextBlock
    v-if="block.kind === 'text'"
    class="generated-block"
    :page="page"
    :block="block"
  />

  <CalloutBlock
    v-else-if="block.kind === 'callout'"
    class="generated-block"
    :page="page"
    :block="block"
  />

  <CompareBlock
    v-else-if="block.kind === 'compare'"
    class="generated-block"
    :page="page"
    :block="block"
  />

  <ImageBlock
    v-else-if="block.kind === 'image'"
    class="generated-block"
    :page="page"
    :block="block"
  />

  <CtaBlock
    v-else-if="block.kind === 'cta'"
    class="generated-block"
    :page="page"
    :block="block"
  />

  <FaqBlock
    v-else-if="block.kind === 'faq'"
    class="generated-block"
    :page="page"
    :block="block"
  />

  <pre
    v-else-if="isDev"
    class="generated-block generated-block--unknown"
  >Unknown generated block: {{ unknownKind }}</pre>
</template>

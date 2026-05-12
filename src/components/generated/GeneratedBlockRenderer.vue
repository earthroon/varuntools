<script setup lang="ts">
import { computed } from 'vue'
import type { GeneratedBlock, GeneratedPage } from '@/types/generatedContent'
import { blockRenderers } from './blockRendererRegistry'

const props = defineProps<{
  page: GeneratedPage
  block: GeneratedBlock
}>()

const component = computed(() => blockRenderers[props.block.kind])
</script>

<template>
  <component
    :is="component"
    v-if="component"
    class="generated-block"
    :page="page"
    :block="block"
  />

  <pre v-else-if="import.meta.env.DEV" class="generated-block generated-block--unknown">
    Unknown generated block: {{ block.kind }}
  </pre>
</template>

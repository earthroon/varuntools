<script setup lang="ts">
import { ref } from 'vue'
import type { CalloutBlock, GeneratedPage } from '@/types/generatedContent'

const props = defineProps<{
  page: GeneratedPage
  block: CalloutBlock
}>()

const open = ref(props.block.defaultOpen)
</script>

<template>
  <aside
    class="generated-block generated-callout"
    :data-block-id="block.id"
    :data-callout-type="block.type"
    :data-tone="block.tone || block.type"
  >
    <button
      v-if="block.collapsible"
      class="generated-callout__summary"
      type="button"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span>{{ block.title || block.type }}</span>
      <span aria-hidden="true">{{ open ? '−' : '+' }}</span>
    </button>

    <div v-else-if="block.title" class="generated-callout__title">
      {{ block.title }}
    </div>

    <p v-if="!block.collapsible || open" class="generated-callout__body">
      {{ block.body }}
    </p>
  </aside>
</template>

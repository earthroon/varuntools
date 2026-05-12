<script setup lang="ts">
import type { FaqBlock, GeneratedPage } from '@/types/generatedContent'

defineProps<{
  page: GeneratedPage
  block: FaqBlock
}>()
</script>

<template>
  <details class="generated-block generated-faq" :data-block-id="block.id">
    <summary>{{ block.question }}</summary>
    <p>{{ block.answer }}</p>
  </details>
</template>

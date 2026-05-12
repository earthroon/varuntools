<script setup lang="ts">
import type { GeneratedPage, TextBlock } from '@/types/generatedContent'

defineProps<{
  page: GeneratedPage
  block: TextBlock
}>()
</script>

<template>
  <section class="generated-block generated-text" :data-block-id="block.id">
    <h2 v-if="block.title" class="generated-block__title">{{ block.title }}</h2>
    <p class="generated-text__body">{{ block.body }}</p>
  </section>
</template>

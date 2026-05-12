<script setup lang="ts">
import { computed } from 'vue'
import type { GeneratedPage } from '@/types/generatedContent'
import { resolveGeneratedAssetSrc } from '@/lib/generated-content/resolveGeneratedAssetSrc'

const props = defineProps<{
  page: GeneratedPage
}>()

const coverSrc = computed(() => props.page.cover ? resolveGeneratedAssetSrc(props.page, props.page.cover.src) : '')
const coverAlt = computed(() => props.page.cover?.alt || props.page.title)
</script>

<template>
  <header class="generated-page__hero">
    <p class="generated-page__eyebrow">{{ page.type }}</p>
    <h1>{{ page.title }}</h1>
    <p v-if="page.desc" class="generated-page__desc">{{ page.desc }}</p>

    <img
      v-if="coverSrc"
      class="generated-page__cover"
      :src="coverSrc"
      :alt="coverAlt"
      loading="eager"
      decoding="async"
    />

    <ul v-if="page.tags.length" class="generated-page__tags" aria-label="태그">
      <li v-for="tag in page.tags" :key="tag">#{{ tag }}</li>
    </ul>
  </header>
</template>

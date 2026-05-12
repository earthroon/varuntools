<script setup lang="ts">
import { computed } from 'vue'
import type { GeneratedPage, ImageBlock } from '@/types/generatedContent'
import { resolveGeneratedAssetSrc } from '@/lib/generated-content/resolveGeneratedAssetSrc'

const props = defineProps<{
  page: GeneratedPage
  block: ImageBlock
}>()

const src = computed(() => resolveGeneratedAssetSrc(props.page, props.block.image.src))
const alt = computed(() => props.block.image.alt || props.block.title || props.page.title || '')
const caption = computed(() => props.block.caption || props.block.image.caption || '')
</script>

<template>
  <figure class="generated-block generated-image" :data-block-id="block.id">
    <figcaption v-if="block.title" class="generated-block__title">{{ block.title }}</figcaption>
    <img :src="src" :alt="alt" loading="lazy" decoding="async" />
    <figcaption v-if="caption" class="generated-image__caption">{{ caption }}</figcaption>
  </figure>
</template>

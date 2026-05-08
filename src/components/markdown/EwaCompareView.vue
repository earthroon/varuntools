<script setup lang="ts">
import type { EwaCompareMode } from '@/media/ewa/ewaDebug'

const props = defineProps<{
  originalSrc: string
  processedSrc?: string
  alt?: string
  mode: EwaCompareMode
  imageStyle?: Record<string, string>
}>()
</script>

<template>
  <div
    class="vt-ewa-compare"
    :data-ewa-compare-mode="mode"
    aria-label="EWA original and processed comparison"
  >
    <figure v-if="mode === 'split'" class="vt-ewa-compare__split">
      <div class="vt-ewa-compare__pane vt-ewa-compare__pane--original">
        <span class="vt-ewa-compare__label">Original</span>
        <img :src="originalSrc" :alt="alt || ''" :style="imageStyle" draggable="false" />
      </div>
      <div class="vt-ewa-compare__pane vt-ewa-compare__pane--processed">
        <span class="vt-ewa-compare__label">EWA</span>
        <img :src="processedSrc || originalSrc" :alt="alt || ''" :style="imageStyle" draggable="false" />
      </div>
    </figure>
    <img
      v-else
      class="vt-ewa-compare__single"
      :src="mode === 'original' ? originalSrc : (processedSrc || originalSrc)"
      :alt="alt || ''"
      :style="imageStyle"
      draggable="false"
    />
  </div>
</template>

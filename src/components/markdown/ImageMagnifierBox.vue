<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
    visible: boolean
    x: number
    y: number
    zoom?: number
  }>(),
  {
    alt: '',
    zoom: 2.4,
  },
)

const zoomValue = computed(() => Math.max(1, props.zoom || 2.4))

const surfaceStyle = computed(() => ({
  backgroundImage: props.src ? `url("${props.src}")` : undefined,
  backgroundSize: `${zoomValue.value * 100}% ${zoomValue.value * 100}%`,
  backgroundPosition: `${props.x}% ${props.y}%`,
}))
</script>

<template>
  <div
    v-if="visible && src"
    class="vt-image-magnifier"
    aria-hidden="true"
  >
    <div
      class="vt-image-magnifier__surface"
      :style="surfaceStyle"
    />
  </div>
</template>

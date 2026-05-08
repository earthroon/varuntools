<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: string
    height?: number
  }>(),
  {
    size: 'md',
    height: 0,
  },
)

const className = computed(() => {
  const allowedSizes = ['sm', 'md', 'lg', 'xl']
  const size = allowedSizes.includes(props.size) ? props.size : 'md'
  return `is-${size}`
})

const styleVars = computed(() => {
  if (!props.height) return {}

  const height = Math.min(240, Math.max(12, props.height))

  return {
    '--vt-section-gap-height': `${height}px`,
  }
})
</script>

<template>
  <div
    class="vt-section-gap"
    :class="className"
    :style="styleVars"
    aria-hidden="true"
  />
</template>

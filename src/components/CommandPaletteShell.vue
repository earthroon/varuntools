<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { afterFirstPaint } from '@/utils/afterFirstPaint'

const CommandPalette = defineAsyncComponent(() => import('@/components/CommandPalette.vue'))
const shouldMountCommandPalette = ref(false)

let cleanupAfterFirstPaint: (() => void) | null = null

onMounted(() => {
  cleanupAfterFirstPaint = afterFirstPaint(() => {
    shouldMountCommandPalette.value = true
  }, 1200)
})

onBeforeUnmount(() => {
  cleanupAfterFirstPaint?.()
  cleanupAfterFirstPaint = null
})
</script>

<template>
  <CommandPalette v-if="shouldMountCommandPalette" />
</template>

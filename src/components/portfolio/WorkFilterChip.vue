<script setup lang="ts">
defineProps<{
  label: string
  value?: string
}>()

defineEmits<{
  remove: []
}>()
</script>

<template>
  <button class="vt-work-filter-chip" type="button" @click="$emit('remove')">
    <span>{{ label }}</span>
    <strong v-if="value">{{ value }}</strong>
    <span aria-hidden="true">×</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  kind?: string
  status?: string
  series?: string
  tags?: string[]
}>()
</script>

<template>
  <div class="vt-work-meta-chips" aria-label="Work metadata">
    <span v-if="kind" class="vt-work-meta-chip">{{ kind }}</span>
    <span v-if="status" class="vt-work-meta-chip">{{ status }}</span>
    <span v-if="series" class="vt-work-meta-chip">series: {{ series }}</span>
    <span v-for="tag in tags || []" :key="tag" class="vt-work-meta-chip">#{{ tag }}</span>
  </div>
</template>

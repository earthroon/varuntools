<script setup lang="ts">
import { computed } from 'vue'
import { getWorkCategoryLabel, getWorkRoleLabel, getWorkStackLabel } from '@/data/workTaxonomy'

const props = withDefaults(
  defineProps<{
    value: string
    kind?: 'category' | 'role' | 'stack' | 'tag'
  }>(),
  {
    kind: 'tag',
  },
)

const label = computed(() => {
  if (props.kind === 'category') return getWorkCategoryLabel(props.value)
  if (props.kind === 'role') return getWorkRoleLabel(props.value)
  if (props.kind === 'stack') return getWorkStackLabel(props.value)
  return props.value
})
</script>

<template>
  <span class="vt-work-taxonomy-badge" :data-kind="kind">{{ label }}</span>
</template>

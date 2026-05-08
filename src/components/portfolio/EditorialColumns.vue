<template>
  <section
    class="vt-editorial-columns"
    :data-cols="cols"
    :data-gap="gap"
    :data-collapse="collapse"
    :data-balance="balance ? 'true' : 'false'"
  >
    <EditorialColumn v-for="(column, index) in normalizedColumns" :key="index" :html="column" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EditorialColumnsProps } from '@/types/editorialBlocks'
import EditorialColumn from './EditorialColumn.vue'

const props = withDefaults(defineProps<EditorialColumnsProps>(), {
  cols: 2,
  gap: 'md',
  collapse: 'mobile',
  balance: false,
})

const normalizedColumns = computed(() => props.columns.slice(0, props.cols))
</script>

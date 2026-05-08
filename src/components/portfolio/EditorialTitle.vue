<template>
  <section class="vt-editorial-title" :data-level="level" :data-align="align">
    <p v-if="kicker" class="vt-editorial-title__kicker" aria-hidden="true">{{ kicker }}</p>
    <component :is="headingTag" class="vt-editorial-title__heading">{{ title }}</component>
    <p v-if="subtitle" class="vt-editorial-title__subtitle">{{ subtitle }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EditorialHeadingAlign, EditorialHeadingBlockProps, EditorialHeadingTag } from '@/types/editorialBlocks'

const props = withDefaults(defineProps<EditorialHeadingBlockProps>(), {
  level: 'middle',
  as: undefined,
  kicker: '',
  subtitle: '',
  align: 'left',
})

const defaultTagByLevel: Record<EditorialHeadingBlockProps['level'], EditorialHeadingTag> = {
  major: 'h2',
  middle: 'h3',
  minor: 'h4',
}

const headingTag = computed(() => props.as || defaultTagByLevel[props.level])
const align = computed<EditorialHeadingAlign>(() => props.align === 'center' ? 'center' : 'left')
</script>

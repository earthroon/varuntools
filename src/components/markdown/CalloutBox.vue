<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: string
    title?: string
    html?: string
  }>(),
  {
    type: 'note',
    title: '',
    html: '',
  },
)
</script>

<template>
  <aside class="vt-callout" :data-type="type">
    <strong v-if="title" class="vt-callout__title">{{ title }}</strong>
    <div class="vt-callout__body" v-html="html" />
  </aside>
</template>

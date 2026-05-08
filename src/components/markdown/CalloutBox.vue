<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: string
    html?: string
  }>(),
  {
    type: 'note',
    html: '',
  },
)
</script>

<template>
  <aside class="vt-callout" :data-type="type">
    <div class="vt-callout__body" v-html="html" />
  </aside>
</template>

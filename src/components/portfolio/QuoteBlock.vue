<script setup lang="ts">
withDefaults(
  defineProps<{
    by?: string
    tone?: string
    size?: string
    html?: string
  }>(),
  {
    by: '',
    tone: 'quiet',
    size: 'normal',
    html: '',
  },
)
</script>

<template>
  <figure class="vt-quote-block" :data-tone="tone" :data-size="size">
    <blockquote class="vt-markdown" v-html="html" />
    <figcaption v-if="by">— {{ by }}</figcaption>
  </figure>
</template>

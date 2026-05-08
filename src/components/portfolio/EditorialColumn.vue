<template>
  <article class="vt-editorial-column" v-html="html"></article>
</template>

<script setup lang="ts">
defineProps<{
  html: string
}>()
</script>

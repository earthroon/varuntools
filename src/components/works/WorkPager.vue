<script setup lang="ts">
import type { WorkCardEntry } from '@/markdown/pageRegistry'

defineProps<{
  previous?: WorkCardEntry | null
  next?: WorkCardEntry | null
}>()
</script>

<template>
  <nav v-if="previous || next" class="vt-work-pager" aria-label="Previous and next works">
    <a v-if="previous" class="vt-work-pager__link is-previous" :href="previous.href">
      <span>Previous</span>
      <strong>{{ previous.title }}</strong>
    </a>

    <a v-if="next" class="vt-work-pager__link is-next" :href="next.href">
      <span>Next</span>
      <strong>{{ next.title }}</strong>
    </a>
  </nav>
</template>

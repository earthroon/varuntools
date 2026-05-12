<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { CtaBlock, GeneratedPage } from '@/types/generatedContent'

const props = defineProps<{
  page: GeneratedPage
  block: CtaBlock
}>()

const href = computed(() => props.block.buttonUrl.trim())
const external = computed(() => /^(?:https?:)?\/\//i.test(href.value) || href.value.startsWith('mailto:'))
const routeTo = computed(() => href.value.startsWith('/') ? href.value : `/${href.value.replace(/^\/+/, '')}`)
</script>

<template>
  <section class="generated-block generated-cta" :data-block-id="block.id" :data-variant="block.variant || 'primary'">
    <div class="generated-cta__body">
      <h2 v-if="block.title" class="generated-block__title">{{ block.title }}</h2>
      <p v-if="block.body">{{ block.body }}</p>
    </div>

    <a
      v-if="external"
      class="generated-cta__button"
      :href="href"
      target="_blank"
      rel="noopener noreferrer"
    >
      {{ block.buttonLabel }}
    </a>
    <RouterLink v-else class="generated-cta__button" :to="routeTo">
      {{ block.buttonLabel }}
    </RouterLink>
  </section>
</template>

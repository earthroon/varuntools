<script setup lang="ts">
import type { GeneratedPage } from '@/types/generatedContent'
import GeneratedPageHero from './GeneratedPageHero.vue'
import GeneratedBlockRenderer from './GeneratedBlockRenderer.vue'

const props = defineProps<{
  page: GeneratedPage
}>()
</script>

<template>
  <article
    class="generated-page theme-showroom"
    :data-page-id="props.page.id"
    :data-page-type="props.page.type"
    :data-template="props.page.template"
  >
    <div class="generated-page__inner">
      <GeneratedPageHero :page="props.page" />

      <section class="generated-page__blocks" aria-label="페이지 콘텐츠">
        <GeneratedBlockRenderer
          v-for="block in props.page.blocks"
          :key="block.id"
          :page="props.page"
          :block="block"
        />
      </section>
    </div>
  </article>
</template>

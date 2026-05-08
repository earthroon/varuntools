<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    html?: string
    src?: string
    srcFound?: boolean
    srcReason?: string
    alt?: string
    thumb?: string
    layout?: string
    role?: string[]
    stack?: string[]
    year?: string | number
    period?: string
    client?: string
    featured?: boolean
    tags?: string[]
  }>(),
  {
    title: '',
    html: '',
    src: '',
    srcFound: true,
    srcReason: '',
    alt: '',
    thumb: '',
    layout: 'split',
    role: () => [],
    stack: () => [],
    year: '',
    period: '',
    client: '',
    featured: false,
    tags: () => [],
  },
)

function firstItems(items: string[], limit: number): string[] {
  return items.filter(Boolean).slice(0, limit)
}

const roleChips = computed(() => firstItems(props.role, 4))
const stackChips = computed(() => firstItems(props.stack, 5))
const tagChips = computed(() => firstItems(props.tags, 5))
const metaLine = computed(() => [props.period || props.year, props.client].filter(Boolean).join(' · '))
const heroImageAlt = computed(() => props.alt || props.title || 'Portfolio cover image')
</script>

<template>
  <section class="vt-portfolio-hero" :data-layout="layout">
    <div class="vt-portfolio-hero__body">
      <p class="vt-portfolio-kicker">Portfolio Case Study</p>
      <h1 v-if="title" class="vt-portfolio-hero__title">{{ title }}</h1>
      <p v-if="metaLine" class="vt-portfolio-hero__meta">{{ metaLine }}</p>
      <div v-if="html" class="vt-portfolio-hero__intro vt-markdown" v-html="html" />

      <div v-if="roleChips.length || stackChips.length || tagChips.length || featured" class="vt-portfolio-chip-cloud">
        <span v-if="featured" class="vt-portfolio-chip vt-portfolio-chip--strong">Featured</span>
        <span v-for="item in roleChips" :key="`role-${item}`" class="vt-portfolio-chip vt-portfolio-chip--role">{{ item }}</span>
        <span v-for="item in stackChips" :key="`stack-${item}`" class="vt-portfolio-chip">{{ item }}</span>
        <span v-for="item in tagChips" :key="`tag-${item}`" class="vt-portfolio-chip vt-portfolio-chip--muted">#{{ item }}</span>
      </div>
    </div>

    <figure v-if="src" class="vt-portfolio-hero__media">
      <img v-if="srcFound" :src="src" :alt="heroImageAlt" loading="eager" decoding="async" fetchpriority="high" />
      <figcaption v-else class="vt-portfolio-media-missing">Missing media: {{ srcReason || src }}</figcaption>
    </figure>
  </section>
</template>

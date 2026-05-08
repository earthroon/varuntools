<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string
    srcFound?: boolean
    srcReason?: string
    alt?: string
    caption?: string
    label?: string
  }>(),
  {
    src: '',
    srcFound: true,
    srcReason: '',
    alt: '',
    caption: '',
    label: '',
  },
)

function imageAlt(): string {
  return props.alt || props.caption || props.label || 'Case gallery image'
}
</script>

<template>
  <figure class="vt-case-gallery-single">
    <img v-if="src && srcFound" :src="src" :alt="imageAlt()" loading="lazy" decoding="async" />
    <figcaption v-else class="vt-portfolio-media-missing" aria-live="polite">
      Missing media: {{ srcReason || src }}
    </figcaption>
    <figcaption v-if="caption || label" class="vt-case-gallery-single__caption">
      <strong v-if="label">{{ label }}</strong>
      <span v-if="caption">{{ caption }}</span>
    </figcaption>
  </figure>
</template>

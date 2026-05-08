<script setup lang="ts">
defineProps<{
  src: string
  srcFound?: boolean
  srcReason?: string
  alt?: string
  caption?: string
  tag?: string
  href?: string
}>()
</script>

<template>
  <a
    v-if="href"
    class="vt-image-card"
    :href="href"
  >
    <img
      v-if="srcFound"
      class="vt-image-card__image"
      :src="src"
      :alt="alt || ''"
      loading="lazy"
      decoding="async"
    />
    <div v-else class="vt-image-card__missing">Image asset missing</div>

    <span v-if="tag" class="vt-image-card__tag">{{ tag }}</span>
    <strong v-if="caption" class="vt-image-card__caption">{{ caption }}</strong>
  </a>

  <figure v-else class="vt-image-card">
    <img
      v-if="srcFound"
      class="vt-image-card__image"
      :src="src"
      :alt="alt || ''"
      loading="lazy"
      decoding="async"
    />
    <div v-else class="vt-image-card__missing">Image asset missing</div>

    <span v-if="tag" class="vt-image-card__tag">{{ tag }}</span>
    <figcaption v-if="caption" class="vt-image-card__caption">{{ caption }}</figcaption>
  </figure>
</template>

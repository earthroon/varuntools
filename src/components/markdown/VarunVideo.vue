<script setup lang="ts">
defineProps<{
  src: string
  fallback?: string
  poster?: string
  caption?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  playsinline?: boolean
  controls?: boolean
  srcFound?: boolean
  fallbackFound?: boolean
  posterFound?: boolean
  srcReason?: string
  fallbackReason?: string
  posterReason?: string
}>()
</script>

<template>
  <figure class="vt-video">
    <video
      v-if="srcFound || fallbackFound"
      class="vt-video__media"
      :poster="posterFound ? poster : undefined"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      :playsinline="playsinline"
      :controls="controls"
      preload="metadata"
    >
      <source v-if="srcFound" :src="src" type="video/webm" />
      <source v-if="fallbackFound" :src="fallback" type="video/mp4" />
      영상을 재생할 수 없습니다.
    </video>

    <div v-else class="vt-media-missing" role="status">
      <strong>Video asset missing</strong>
      <span>src 또는 fallback 파일을 찾을 수 없습니다.</span>
    </div>

    <figcaption v-if="caption" class="vt-video__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

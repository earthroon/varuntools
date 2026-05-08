<script setup lang="ts">
export type GalleryStripLayout = 'strip' | 'grid' | 'compact'

export type GalleryStripItem = {
  src: string
  thumbSrc?: string
  alt?: string
  caption?: string
  source?: string
  thumbSource?: string
  srcFound?: boolean
  thumbFound?: boolean
  srcReason?: string
  thumbReason?: string
  title?: string
  meta?: Record<string, string>
  media?: {
    ewaPreset?: string
    ewaMode?: string
    pixelSafe?: boolean
    ewaEnabled?: boolean
    ewaNote?: string
  }
}

const props = withDefaults(
  defineProps<{
    title?: string
    caption?: string
    layout?: GalleryStripLayout
    lightbox?: boolean
    groupId: string
    items: GalleryStripItem[]
  }>(),
  {
    title: '',
    caption: '',
    layout: 'strip',
    lightbox: true,
  },
)

function openAt(index: number): void {
  if (!props.lightbox) return
  const item = props.items[index]
  if (!item || item.srcFound === false) return

  window.dispatchEvent(
    new CustomEvent('vt:open-gallery', {
      detail: {
        groupId: props.groupId,
        index,
        items: props.items,
      },
    }),
  )
}
</script>

<template>
  <section
    class="vt-gallery-strip vt-media-breakout"
    :data-layout="layout"
    :data-gallery-group="groupId"
    data-vt-manual-gallery="1"
    aria-label="이미지 갤러리"
  >
    <header v-if="title || caption" class="vt-gallery-strip__header">
      <strong v-if="title" class="vt-gallery-strip__title">{{ title }}</strong>
      <p v-if="caption" class="vt-gallery-strip__caption">{{ caption }}</p>
    </header>

    <div class="vt-gallery-strip__items">
      <button
        v-for="(item, index) in items"
        :key="`${item.src}-${index}`"
        class="vt-gallery-strip__thumb"
        type="button"
        :disabled="item.srcFound === false"
        :data-vt-gallery-caption="item.caption || ''"
        :data-vt-gallery-title="item.title || item.meta?.title || ''"
        :data-vt-gallery-source="item.source || item.src"
        :aria-label="`${index + 1}번째 이미지 열기${item.title || item.caption ? `: ${item.title || item.caption}` : ''}`"
        @click="openAt(index)"
      >
        <img
          v-if="item.srcFound !== false"
          :src="item.thumbSrc || item.src"
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
        />
        <span v-else class="vt-gallery-strip__missing">Missing</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
export type CaseGalleryItem = {
  src: string
  thumbSrc?: string
  alt?: string
  caption?: string
  label?: string
  source?: string
  thumbSource?: string
  srcFound?: boolean
  thumbFound?: boolean
  srcReason?: string
  thumbReason?: string
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
    columns?: number
    variant?: string
    captionStyle?: string
    groupId: string
    items: CaseGalleryItem[]
  }>(),
  {
    title: '',
    caption: '',
    columns: 2,
    variant: 'framed',
    captionStyle: 'below',
  },
)

function captionId(index: number): string {
  return `${props.groupId}-caption-${index}`
}

function itemLabel(item: CaseGalleryItem, index: number): string {
  const label = item.label || item.caption || item.alt || `Case gallery item ${index + 1}`
  return item.srcFound === false ? `미디어 누락: ${label}` : `${label} 열기`
}

function imageAlt(item: CaseGalleryItem): string {
  return item.alt || item.caption || item.label || 'Case gallery image'
}

function openAt(index: number): void {
  const item = props.items[index]
  if (!item || item.srcFound === false) return
  window.dispatchEvent(
    new CustomEvent('vt:open-gallery', {
      detail: { groupId: props.groupId, index, items: props.items },
    }),
  )
}
</script>

<template>
  <section
    class="vt-case-gallery"
    :data-variant="variant"
    :data-caption-style="captionStyle"
    :style="{ '--case-gallery-columns': String(columns) }"
  >
    <header v-if="title || caption" class="vt-case-gallery__header">
      <p class="vt-portfolio-kicker">Gallery</p>
      <h2 v-if="title">{{ title }}</h2>
      <p v-if="caption">{{ caption }}</p>
    </header>
    <div class="vt-case-gallery__grid">
      <button
        v-for="(item, index) in items"
        :key="`${item.src}-${index}`"
        class="vt-case-gallery__item"
        type="button"
        :disabled="item.srcFound === false"
        :aria-label="itemLabel(item, index)"
        :aria-describedby="item.caption ? captionId(index) : undefined"
        @click="openAt(index)"
      >
        <img
          v-if="item.srcFound !== false"
          :src="item.thumbSrc || item.src"
          :alt="imageAlt(item)"
          loading="lazy"
          decoding="async"
        />
        <span v-else class="vt-portfolio-media-missing" aria-live="polite">
          Missing media<span v-if="item.srcReason">: {{ item.srcReason }}</span>
        </span>
        <span v-if="item.label" class="vt-case-gallery__label">{{ item.label }}</span>
        <span v-if="item.caption" :id="captionId(index)" class="vt-case-gallery__caption">
          {{ item.caption }}
        </span>
      </button>
    </div>
  </section>
</template>

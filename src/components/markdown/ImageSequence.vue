<script setup lang="ts">
type ImageSequenceItem = {
  assetId?: string
  src: string
  srcFound: boolean
  srcReason: string
  source: string
  alt: string
  caption?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

const props = withDefaults(
  defineProps<{
    layout?: 'crop-strip'
    reserved?: boolean
    lazy?: boolean
    fade?: boolean
    width?: number
    height?: number
    items: ImageSequenceItem[]
  }>(),
  {
    layout: 'crop-strip',
    reserved: true,
    lazy: true,
    fade: true,
  },
)

function loadingMode(): 'lazy' | 'eager' {
  return props.lazy ? 'lazy' : 'eager'
}

function positiveNumber(value: number | undefined): number | undefined {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function ratioForItem(item: ImageSequenceItem): string {
  const width = positiveNumber(item.width) ?? positiveNumber(props.width)
  const height = positiveNumber(item.height) ?? positiveNumber(props.height)

  if (width && height) return String(width) + ' / ' + String(height)
  return '16 / 9'
}

function itemStyle(item: ImageSequenceItem): Record<string, string> {
  return {
    '--vt-image-sequence-ratio': ratioForItem(item),
  }
}
</script>

<template>
  <figure
    class="vt-image-sequence vt-media-breakout"
    :data-layout="layout"
    :data-reserved="reserved ? '1' : '0'"
    :data-fade="fade ? '1' : '0'"
    aria-label="Image sequence"
  >
    <div class="vt-image-sequence__track" role="list">
      <article
        v-for="(item, index) in items"
        :key="item.assetId || item.source || index"
        class="vt-image-sequence__item"
        role="listitem"
        :style="itemStyle(item)"
      >
        <div class="vt-image-sequence__frame">
          <img
            v-if="item.srcFound"
            class="vt-image-sequence__image"
            :src="item.src"
            :alt="item.alt"
            :width="item.width"
            :height="item.height"
            :loading="loadingMode()"
            decoding="async"
            draggable="false"
            :data-vt-source="item.source || undefined"
          />

          <div v-else class="vt-media-missing vt-image-sequence__missing" role="status">
            <strong>Image asset missing</strong>
            <span>{{ item.srcReason || item.source }}</span>
          </div>
        </div>

        <figcaption v-if="item.caption" class="vt-image-sequence__caption">
          {{ item.caption }}
        </figcaption>
      </article>
    </div>
  </figure>
</template>

<style scoped>
.vt-image-sequence {
  display: grid;
  gap: 12px;
  margin: 24px 0;
}

.vt-image-sequence__track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  padding-bottom: 4px;
}

.vt-image-sequence__item {
  flex: 0 0 min(82vw, 560px);
  min-width: 0;
  scroll-snap-align: start;
}

.vt-image-sequence__frame {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background: rgba(36, 31, 26, .06);
  aspect-ratio: var(--vt-image-sequence-ratio, 16 / 9);
}

.vt-image-sequence__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vt-image-sequence__missing {
  display: grid;
  min-height: 100%;
  place-content: center;
  gap: 6px;
  padding: 18px;
  text-align: center;
}

.vt-image-sequence__caption {
  margin-top: 7px;
  color: rgba(36, 31, 26, .66);
  font-size: 12px;
  line-height: 1.5;
}

.vt-image-sequence[data-fade="1"] .vt-image-sequence__image {
  transition: opacity .18s ease;
}

@media (max-width: 720px) {
  .vt-image-sequence__item {
    flex-basis: 86vw;
  }
}
</style>

<script setup lang="ts">
type ImageSequenceLayout = 'crop-strip'

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
    layout?: ImageSequenceLayout
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
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : undefined
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
    class="vt-image-sequence"
    :data-layout="props.layout"
    :data-reserved="props.reserved ? '1' : '0'"
    :data-fade="props.fade ? '1' : '0'"
    aria-label="Image sequence"
  >
    <div class="vt-image-sequence__track" role="list">
      <article
        v-for="(item, index) in props.items"
        :key="item.assetId || item.source || index"
        class="vt-image-sequence__item"
        role="listitem"
        :style="itemStyle(item)"
        :data-asset-id="item.assetId || undefined"
        :data-source="item.source"
        :data-src-found="item.srcFound ? '1' : '0'"
        :data-src-reason="item.srcReason"
        :data-filename="item.filename || undefined"
        :data-mime-type="item.mimeType || undefined"
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
            :data-source="item.source"
            :data-src-reason="item.srcReason"
          >

          <div
            v-else
            class="vt-media-missing vt-image-sequence__missing"
            role="status"
            :data-source="item.source"
            :data-src-reason="item.srcReason"
          >
            <strong>Image asset missing</strong>
            <span>{{ item.srcReason || 'unresolved_content_asset' }}</span>
            <code v-if="item.source">{{ item.source }}</code>
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
  padding-bottom: 4px;
  scroll-snap-type: x proximity;
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
  background: rgba(36, 31, 26, 0.06);
  aspect-ratio: var(--vt-image-sequence-ratio, 16 / 9);
}

.vt-image-sequence__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vt-image-sequence[data-fade="1"] .vt-image-sequence__image {
  transition: opacity 0.18s ease;
}

.vt-image-sequence__caption {
  margin-top: 7px;
  color: rgba(36, 31, 26, 0.66);
  font-size: 12px;
  line-height: 1.5;
}

.vt-image-sequence__missing {
  display: grid;
  min-height: 100%;
  place-content: center;
  gap: 6px;
  padding: 16px;
  text-align: center;
}

.vt-image-sequence__missing code {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

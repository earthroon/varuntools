<script setup lang="ts">
export type ImageSequenceItem = {
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

function itemKey(item: ImageSequenceItem, index: number): string {
  return item.assetId || item.source || item.src || String(index)
}

function itemFrameStyle(item: ImageSequenceItem): Record<string, string> | undefined {
  if (!props.reserved || !item.width || !item.height) return undefined
  return { aspectRatio: `${item.width} / ${item.height}` }
}

function loadingMode(): 'lazy' | 'eager' {
  return props.lazy ? 'lazy' : 'eager'
}
</script>

<template>
  <figure
    class="vt-image-sequence vt-media-breakout"
    :data-layout="props.layout"
    :data-reserved="props.reserved ? '1' : '0'"
    :data-fade="props.fade ? '1' : '0'"
  >
    <div class="vt-image-sequence__track">
      <article
        v-for="(item, index) in props.items"
        :key="itemKey(item, index)"
        class="vt-image-sequence__item"
        :data-asset-id="item.assetId || undefined"
      >
        <div class="vt-image-sequence__frame" :style="itemFrameStyle(item)">
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
            <span>{{ item.srcReason || item.source || 'unknown image asset' }}</span>
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
  margin: 28px 0;
}

.vt-image-sequence__track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 2px 2px 10px;
  scroll-snap-type: x proximity;
}

.vt-image-sequence__item {
  display: grid;
  flex: 0 0 min(78vw, 520px);
  gap: 8px;
  min-width: 0;
  scroll-snap-align: start;
}

.vt-image-sequence__frame {
  display: grid;
  min-height: 120px;
  overflow: hidden;
  border-radius: 18px;
  background: rgba(36, 31, 26, .05);
}

.vt-image-sequence__image {
  display: block;
  width: 100%;
  height: auto;
  align-self: center;
}

.vt-image-sequence__caption {
  color: rgba(36, 31, 26, .68);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.45;
}

.vt-image-sequence__missing {
  min-height: 120px;
}
</style>

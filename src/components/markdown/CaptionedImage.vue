<script setup lang="ts">
import { computed } from 'vue'
import { isCaptionTag, type CaptionTag } from '@/markdown/captionTag'

let captionedImageIdSeed = 0

const props = withDefaults(
  defineProps<{
    src: string
    srcFound?: boolean
    srcReason?: string
    source?: string
    alt?: string
    caption?: string
    tag?: CaptionTag | string
    lightbox?: boolean
  }>(),
  {
    srcFound: true,
    srcReason: '',
    source: '',
    alt: '',
    caption: '',
    tag: '',
    lightbox: true,
  },
)

const instanceId = `captioned-image-${++captionedImageIdSeed}`
const safeTag = computed(() => (isCaptionTag(props.tag) ? props.tag : ''))
const cleanCaption = computed(() => props.caption || '')
const lightboxCaption = computed(() => props.caption || props.alt || '')
const tooltipId = computed(() => `${instanceId}-tooltip`)
const flagLabel = computed(() => {
  const target = props.alt || props.caption
  return target ? `이미지 설명 보기: ${target}` : '이미지 설명 보기'
})
</script>

<template>
  <figure
    class="vt-captioned-image vt-media-breakout"
    :data-has-caption="caption ? '1' : '0'"
    :data-has-chip="safeTag ? '1' : '0'"
    :data-caption-kind="safeTag || undefined"
  >
    <div class="vt-captioned-image__frame">
      <img
        v-if="srcFound"
        class="vt-captioned-image__image"
        :src="src"
        :alt="alt || ''"
        loading="lazy"
        decoding="async"
        draggable="false"
        :data-vt-lightbox="lightbox ? '1' : undefined"
        :data-vt-caption="lightboxCaption"
        :data-vt-source="source || undefined"
      />

      <div v-else class="vt-media-missing vt-captioned-image__missing" role="status">
        <strong>Image asset missing</strong>
        <span>{{ srcReason || source || 'unknown image asset' }}</span>
      </div>

      <span
        v-if="safeTag"
        class="vt-captioned-image__chip vt-captioned-image__badge"
        :data-type="safeTag"
        aria-hidden="true"
      >
        {{ safeTag }}
      </span>

      <button
        v-if="caption"
        class="vt-captioned-image__flag vt-captioned-image__help"
        type="button"
        :aria-label="flagLabel"
        :aria-describedby="tooltipId"
      >
        ?
      </button>

      <div
        v-if="caption"
        :id="tooltipId"
        class="vt-captioned-image__tooltip"
        role="tooltip"
      >
        {{ cleanCaption }}
      </div>
    </div>
  </figure>
</template>

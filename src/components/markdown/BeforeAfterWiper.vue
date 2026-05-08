<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    before: string
    after: string
    caption?: string
    initial?: number
    beforeFound?: boolean
    afterFound?: boolean
    beforeReason?: string
    afterReason?: string
  }>(),
  {
    caption: '',
    initial: 50,
    beforeFound: true,
    afterFound: true,
    beforeReason: '',
    afterReason: '',
  },
)

const pct = ref(clampPct(props.initial))
const dragging = ref(false)
const stageEl = ref<HTMLElement | null>(null)
const naturalRatio = ref('16 / 9')
const beforeLoaded = ref(false)

const hasBefore = computed(() => props.beforeFound !== false)
const hasAfter = computed(() => props.afterFound !== false)
const canRenderSlider = computed(() => hasBefore.value && hasAfter.value)
const roundedPct = computed(() => Math.round(pct.value))
const sliderValueText = computed(() => `후 이미지 ${roundedPct.value}% 표시`)
const afterClipPath = computed(() => `inset(0 ${100 - pct.value}% 0 0)`)

const styleVars = computed(() => ({
  '--ba-pct': `${pct.value}%`,
  '--ba-aspect-ratio': naturalRatio.value,
}))

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, value))
}

function setPct(next: number) {
  pct.value = clampPct(next)
}

function percentFromClientX(clientX: number) {
  if (!stageEl.value) return pct.value

  const rect = stageEl.value.getBoundingClientRect()
  if (rect.width <= 0) return pct.value

  return ((clientX - rect.left) / rect.width) * 100
}

function handleRangeInput(event: Event) {
  const input = event.target as HTMLInputElement
  setPct(Number(input.value))
}

function handleBeforeImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  const width = img.naturalWidth
  const height = img.naturalHeight

  if (width > 0 && height > 0) {
    naturalRatio.value = `${width} / ${height}`
    beforeLoaded.value = true
  }
}

function onPointerDown(event: PointerEvent) {
  if (!canRenderSlider.value) return
  dragging.value = true
  stageEl.value?.setPointerCapture(event.pointerId)
  setPct(percentFromClientX(event.clientX))
  event.preventDefault()
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  setPct(percentFromClientX(event.clientX))
  event.preventDefault()
}

function stopDrag(event?: PointerEvent) {
  dragging.value = false
  if (event && stageEl.value?.hasPointerCapture(event.pointerId)) {
    stageEl.value.releasePointerCapture(event.pointerId)
  }
}
</script>

<template>
  <figure class="vt-before-after-figure vt-media-breakout">
    <div
      v-if="canRenderSlider"
      ref="stageEl"
      class="vt-before-after"
      data-wiper-contract="overlay-clip"
      :class="{ 'is-image-loaded': beforeLoaded }"
      :style="styleVars"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @pointerleave="stopDrag"
    >
      <img
        class="vt-before-after__image vt-before-after__image--before"
        :src="before"
        alt="Before"
        loading="lazy"
        decoding="async"
        draggable="false"
        @load="handleBeforeImageLoad"
      />

      <img
        class="vt-before-after__image vt-before-after__image--after"
        :src="after"
        alt="After"
        loading="lazy"
        decoding="async"
        draggable="false"
        :style="{ clipPath: afterClipPath }"
      />

      <div
        class="vt-before-after__line"
        aria-hidden="true"
      />
      <div
        class="vt-before-after__handle"
        aria-hidden="true"
      />

      <input
        class="vt-before-after__range"
        type="range"
        min="0"
        max="100"
        :value="pct"
        :aria-label="caption ? `${caption} 비교 슬라이더` : '전후 비교 슬라이더'"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="roundedPct"
        :aria-valuetext="sliderValueText"
        @input="handleRangeInput"
      />
    </div>

    <div v-else class="vt-before-after__missing" role="status">
      <strong>Before/After asset missing</strong>
      <span v-if="!hasBefore">before: {{ beforeReason || before }}</span>
      <span v-if="!hasAfter">after: {{ afterReason || after }}</span>
    </div>

    <figcaption v-if="caption" class="vt-before-after__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

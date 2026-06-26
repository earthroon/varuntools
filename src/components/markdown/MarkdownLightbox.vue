<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import type { SectionLightboxItem } from "@/composables/useSectionLightbox";
import { useEwaGalleryProcessor } from "@/composables/useEwaGalleryProcessor";
import EwaDebugPanel from "@/components/markdown/EwaDebugPanel.vue";
import EwaCompareView from "@/components/markdown/EwaCompareView.vue";
import { getEwaDeviceDiagnostics } from "@/media/ewa/ewaWebGpuRuntime";
import type { EwaDeviceDiagnostics } from "@/media/ewa/ewaDiagnostics";
import { getEwaCompareMode, isEwaDebugEnabled } from "@/media/ewa/ewaDebug";
import {
  getTouchCenter,
  getTouchDistance,
  isStrictDoubleTap,
} from "@/composables/useTouchGesture";
import {
  clamp,
  clampPan,
  getContainedSize,
  getFocalZoomPan,
  type Pan,
  type Point,
  type Size,
} from "@/composables/useLightboxZoomMath";

const props = withDefaults(
  defineProps<{
    open: boolean;
    item: SectionLightboxItem | null;
    items?: SectionLightboxItem[];
    count: number;
    index: number;
  }>(),
  { items: () => [] },
);

const emit = defineEmits<{
  close: [];
  previous: [];
  next: [];
  setIndex: [index: number];
}>();

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;
const DOUBLE_TAP_MS = 220;
const DOUBLE_TAP_DISTANCE_PX = 28;
const SWIPE_MIN_DISTANCE = 54;
const SWIPE_MAX_VERTICAL_DRIFT = 42;
const SWIPE_MAX_DURATION_MS = 520;

const closeButton = ref<HTMLButtonElement | null>(null);
const thumbsRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const stageSize = ref<Size>({ width: 1, height: 1 });
let stageResizeObserver: ResizeObserver | null = null;
const zoom = ref(1);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const panStart = ref({ clientX: 0, clientY: 0, panX: 0, panY: 0 });
const imageNaturalSize = ref<Size>({ width: 1, height: 1 });
const isPinching = ref(false);
const pinchStartDistance = ref(0);
const pinchStartZoom = ref(1);
const pinchCenter = ref<Point>({ x: 0, y: 0 });
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchLastX = ref(0);
const touchLastY = ref(0);
const touchStartAt = ref(0);
const lastTapAt = ref(0);
const lastTapX = ref(0);
const lastTapY = ref(0);
let previousFocus: HTMLElement | null = null;
const isMetaOpen = ref(false);
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
const ewaDeviceDiagnostics = ref<EwaDeviceDiagnostics | null>(null);
const {
  state: ewaState,
  outputUrl: ewaOutputUrl,
  diagnostics: ewaDiagnostics,
  fallbackReason: ewaFallbackReason,
  isProcessing: isEwaProcessing,
  processActiveItem,
  clearRuntimeResult,
} = useEwaGalleryProcessor({ stageRef });

const dialogLabel = computed(
  () => props.item?.caption || props.item?.alt || "이미지 확대 보기",
);
const currentTitle = computed(() => props.item?.title || props.item?.caption || props.item?.alt || "Image");
const currentCaption = computed(() => props.item?.caption || props.item?.alt || "");
const currentSource = computed(() => props.item?.source || props.item?.src || "");
const ewaDebugEnabled = computed(() => isEwaDebugEnabled());
const ewaCompareMode = computed(() => getEwaCompareMode());
// Original-first contract: the source image remains visible until a successful EWA output exists.
const displayImageSrc = computed(() => {
  if (ewaDebugEnabled.value && ewaCompareMode.value === 'original') return props.item?.src || '';
  return ewaOutputUrl.value || props.item?.src || '';
});
const hasEwaOutput = computed(() => Boolean(ewaOutputUrl.value));
const showEwaCompareView = computed(() => (
  ewaDebugEnabled.value &&
  ewaCompareMode.value !== 'off' &&
  ewaCompareMode.value !== 'processed' &&
  Boolean(props.item?.src)
));
const ewaStatusLabel = computed(() => {
  if (isEwaProcessing.value) return 'EWA refining active image';
  if (ewaState.value === 'ready' && hasEwaOutput.value) {
    return ewaDebugEnabled.value ? `EWA refined ? ${ewaCompareMode.value}` : 'EWA refined';
  }
  if (ewaState.value === 'ready' && !hasEwaOutput.value) {
    return ewaDebugEnabled.value ? 'EWA ready ? output missing ? original kept' : '';
  }
  if (ewaState.value === 'timeout') return ewaDebugEnabled.value ? 'EWA timeout ? original kept' : '';
  if (ewaState.value === 'unsupported') return '';
  if (ewaState.value === 'fallback' && ewaFallbackReason.value) return '';
  return '';
});
const currentGroupId = computed(() => props.item?.groupId || "");
const copyStatusLabel = computed(() => {
  if (copyState.value === 'copied') return '링크를 복사했습니다';
  if (copyState.value === 'failed') return '링크 복사 실패';
  return '';
});
const isZoomed = computed(() => zoom.value > 1);
const zoomLabel = computed(() => `${zoom.value.toFixed(1)}×`);
const imageTransform = computed(
  () => `translate3d(${panX.value}px, ${panY.value}px, 0) scale(${zoom.value})`,
);
const imageFitSize = computed(() =>
  getContainedSize({
    container: stageSize.value,
    natural: imageNaturalSize.value,
  }),
);
const imageRenderStyle = computed(() => ({
  width: `${imageFitSize.value.width}px`,
  height: `${imageFitSize.value.height}px`,
  transform: imageTransform.value,
}));
const canResetZoom = computed(
  () => zoom.value !== 1 || panX.value !== 0 || panY.value !== 0,
);

function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}
function scrollActiveThumbIntoView() {
  const active = thumbsRef.value?.querySelector<HTMLElement>(
    `[data-thumb-index="${props.index}"]`,
  );
  active?.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "nearest",
    inline: "center",
  });
}
function selectThumb(index: number) {
  emit("setIndex", index);
}

function resetGestureState() {
  isPanning.value = false;
  isPinching.value = false;
  pinchStartDistance.value = 0;
  pinchStartZoom.value = 1;
  touchStartX.value = 0;
  touchStartY.value = 0;
  touchLastX.value = 0;
  touchLastY.value = 0;
  touchStartAt.value = 0;
  lastTapAt.value = 0;
  lastTapX.value = 0;
  lastTapY.value = 0;
}

function measureStageSize() {
  const rect = stageRef.value?.getBoundingClientRect();
  stageSize.value = {
    width: Math.max(1, rect?.width || 1),
    height: Math.max(1, rect?.height || 1),
  };
}

function bindStageResizeObserver() {
  stageResizeObserver?.disconnect();

  if (!stageRef.value) {
    measureStageSize();
    return;
  }

  if (typeof ResizeObserver === 'undefined') {
    measureStageSize();
    clampCurrentPan();
    return;
  }

  stageResizeObserver = new ResizeObserver(() => {
    measureStageSize();
    clampCurrentPan();
  });
  stageResizeObserver.observe(stageRef.value);
  measureStageSize();
  clampCurrentPan();
}

function getStageSize(): Size {
  return stageSize.value;
}

function getImageBaseSize(): Size {
  return imageFitSize.value;
}

function setPan(nextPan: Pan) {
  const clamped = clampPan({
    stageSize: getStageSize(),
    imageBaseSize: getImageBaseSize(),
    zoom: zoom.value,
    pan: nextPan,
  });

  panX.value = clamped.x;
  panY.value = clamped.y;
}

function clampCurrentPan() {
  setPan({ x: panX.value, y: panY.value });
}

function setZoom(nextZoom: number, focalPoint?: Point) {
  const currentZoom = zoom.value;
  const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

  if (clampedZoom <= 1) {
    zoom.value = 1;
    panX.value = 0;
    panY.value = 0;
    isPanning.value = false;
    return;
  }

  if (focalPoint) {
    const nextPan = getFocalZoomPan({
      stageSize: getStageSize(),
      imageBaseSize: getImageBaseSize(),
      currentZoom,
      nextZoom: clampedZoom,
      currentPan: { x: panX.value, y: panY.value },
      focalPoint,
    });

    panX.value = nextPan.x;
    panY.value = nextPan.y;
  }

  zoom.value = clampedZoom;
  clampCurrentPan();
}

function getStageFocalPoint(clientX: number, clientY: number): Point {
  const rect = stageRef.value?.getBoundingClientRect();

  return {
    x: clientX - (rect?.left || 0),
    y: clientY - (rect?.top || 0),
  };
}

function handleLightboxImageLoad(event: Event) {
  const img = event.currentTarget as HTMLImageElement;
  const src = String(img.currentSrc || img.src || '');
  const isEwaOutputImage = src.startsWith('blob:');

  if (!isEwaOutputImage && img.naturalWidth > 0 && img.naturalHeight > 0) {
    imageNaturalSize.value = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  }

  clampCurrentPan();
}

function zoomIn() {
  setZoom(zoom.value + ZOOM_STEP);
}

function zoomOut() {
  setZoom(zoom.value - ZOOM_STEP);
}

function resetZoom() {
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
  isPanning.value = false;
  isPinching.value = false;
  pinchStartDistance.value = 0;
}

function getCurrentGalleryHash() {
  if (!currentGroupId.value) return '';
  return `#vt-gallery=${encodeURIComponent(currentGroupId.value)}:${props.index}`;
}

function getCurrentImageShareUrl() {
  const url = new URL(window.location.href);
  const hash = getCurrentGalleryHash();
  if (hash) url.hash = hash;
  return url.toString();
}

async function copyCurrentImageLink() {
  copyState.value = 'idle';
  try {
    await navigator.clipboard.writeText(getCurrentImageShareUrl());
    copyState.value = 'copied';
  } catch {
    copyState.value = 'failed';
  }
}

function requestClose() {
  clearRuntimeResult(true);
  resetZoom();
  resetGestureState();
  emit("close");
}

function handleImagePointerDown(event: PointerEvent) {
  if (!isZoomed.value) return;

  isPanning.value = true;
  panStart.value = {
    clientX: event.clientX,
    clientY: event.clientY,
    panX: panX.value,
    panY: panY.value,
  };

  const target = event.currentTarget as HTMLElement;
  target.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function handleImagePointerMove(event: PointerEvent) {
  if (!isPanning.value || !isZoomed.value) return;

  setPan({
    x: panStart.value.panX + (event.clientX - panStart.value.clientX),
    y: panStart.value.panY + (event.clientY - panStart.value.clientY),
  });
}

function handleImagePointerUp(event: PointerEvent) {
  if (!isPanning.value) return;

  isPanning.value = false;
  const target = event.currentTarget as HTMLElement;
  target.releasePointerCapture?.(event.pointerId);
}

function handleImageWheel(event: WheelEvent) {
  if (!event.ctrlKey) return;

  event.preventDefault();
  const focalPoint = getStageFocalPoint(event.clientX, event.clientY);

  if (event.deltaY < 0) setZoom(zoom.value + ZOOM_STEP, focalPoint);
  else setZoom(zoom.value - ZOOM_STEP, focalPoint);
}

function isInteractiveLightboxControl(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest("button") ||
    target.closest("a") ||
    target.closest("input") ||
    target.closest(".vt-lightbox__thumbs") ||
    target.closest(".vt-lightbox__zoom-controls"),
  );
}

function handleTouchStart(event: TouchEvent) {
  if (isInteractiveLightboxControl(event.target)) return;

  if (event.touches.length === 2) {
    const first = event.touches.item(0);
    const second = event.touches.item(1);
    if (!first || !second) return;

    const center = getTouchCenter(first, second);

    isPinching.value = true;
    pinchStartDistance.value = getTouchDistance(first, second);
    pinchStartZoom.value = zoom.value;
    pinchCenter.value = getStageFocalPoint(center.x, center.y);
    isPanning.value = false;
    event.preventDefault();
    return;
  }

  if (event.touches.length === 1) {
    const touch = event.touches.item(0);
    if (!touch) return;
    const now = performance.now();

    touchStartX.value = touch.clientX;
    touchStartY.value = touch.clientY;
    touchLastX.value = touch.clientX;
    touchLastY.value = touch.clientY;
    touchStartAt.value = now;
  }
}

function handleTouchMove(event: TouchEvent) {
  if (isInteractiveLightboxControl(event.target)) return;

  if (isPinching.value && event.touches.length === 2) {
    const first = event.touches.item(0);
    const second = event.touches.item(1);
    if (!first || !second) return;

    const nextDistance = getTouchDistance(first, second);
    if (pinchStartDistance.value > 0) {
      const scale = nextDistance / pinchStartDistance.value;
      setZoom(pinchStartZoom.value * scale, pinchCenter.value);
    }

    event.preventDefault();
    return;
  }

  if (event.touches.length === 1) {
    const touch = event.touches.item(0);
    if (!touch) return;
    const dx = touch.clientX - touchLastX.value;
    const dy = touch.clientY - touchLastY.value;

    touchLastX.value = touch.clientX;
    touchLastY.value = touch.clientY;

    if (zoom.value > 1) {
      setPan({
        x: panX.value + dx,
        y: panY.value + dy,
      });
      event.preventDefault();
    }
  }
}

function handleTouchEnd(event: TouchEvent) {
  if (isInteractiveLightboxControl(event.target)) return;

  if (isPinching.value) {
    if (event.touches.length < 2) {
      isPinching.value = false;
      pinchStartDistance.value = 0;
    }
    return;
  }

  if (touchStartAt.value <= 0) return;

  const now = performance.now();
  const dx = touchLastX.value - touchStartX.value;
  const dy = touchLastY.value - touchStartY.value;
  const elapsed = now - touchStartAt.value;

  const isSwipe =
    zoom.value <= 1 &&
    Math.abs(dx) >= SWIPE_MIN_DISTANCE &&
    Math.abs(dy) <= SWIPE_MAX_VERTICAL_DRIFT &&
    elapsed <= SWIPE_MAX_DURATION_MS;

  if (isSwipe) {
    if (dx < 0) emit("next");
    else emit("previous");
    touchStartAt.value = 0;
    lastTapAt.value = 0;
    return;
  }

  const isDoubleTap = isStrictDoubleTap({
    now,
    x: touchLastX.value,
    y: touchLastY.value,
    lastTapAt: lastTapAt.value,
    lastTapX: lastTapX.value,
    lastTapY: lastTapY.value,
    thresholdMs: DOUBLE_TAP_MS,
    distancePx: DOUBLE_TAP_DISTANCE_PX,
  });

  if (isDoubleTap) {
    if (zoom.value > 1) resetZoom();
    else setZoom(2, getStageFocalPoint(touchLastX.value, touchLastY.value));

    lastTapAt.value = 0;
    lastTapX.value = 0;
    lastTapY.value = 0;
    touchStartAt.value = 0;
    event.preventDefault();
    return;
  }

  lastTapAt.value = now;
  lastTapX.value = touchLastX.value;
  lastTapY.value = touchLastY.value;
  touchStartAt.value = 0;
}

function handleResize() {
  clampCurrentPan();
}

function handleZoomKeydown(event: KeyboardEvent) {
  if (!props.open) return;

  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    zoomIn();
    return;
  }

  if (event.key === "-" || event.key === "_") {
    event.preventDefault();
    zoomOut();
    return;
  }

  if (event.key === "0") {
    event.preventDefault();
    resetZoom();
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      resetZoom();
      resetGestureState();
      copyState.value = 'idle';
      await nextTick();
      bindStageResizeObserver();
      closeButton.value?.focus();
      scrollActiveThumbIntoView();
      return;
    }
    resetZoom();
    resetGestureState();
    stageResizeObserver?.disconnect();
    previousFocus?.focus?.();
    previousFocus = null;
  },
);
watch(
  () => props.index,
  async () => {
    resetZoom();
    resetGestureState();
    copyState.value = 'idle';
    await nextTick();
    measureStageSize();
    clampCurrentPan();
    scrollActiveThumbIntoView();
  },
);

watch(
  () => [props.open, props.index, props.item?.src || ''],
  async ([open]) => {
    if (!open || !props.item) {
      clearRuntimeResult(true);
      return;
    }
    await nextTick();
    if (ewaDebugEnabled.value) {
      try { ewaDeviceDiagnostics.value = await getEwaDeviceDiagnostics(); } catch { ewaDeviceDiagnostics.value = null; }
    }
    await processActiveItem(props.item);
  },
  { flush: 'post' },
);

onMounted(() => {
  window.addEventListener("keydown", handleZoomKeydown);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleZoomKeydown);
  window.removeEventListener("resize", handleResize);
  stageResizeObserver?.disconnect();
  stageResizeObserver = null;
  clearRuntimeResult(true);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && item"
      class="vt-lightbox"
      role="dialog"
      aria-modal="true"
      :aria-label="dialogLabel"
    >
      <button
        class="vt-lightbox__backdrop"
        type="button"
        aria-label="확대 이미지 닫기"
        @click="requestClose"
      />
      <div class="vt-lightbox__panel">
        <button
          ref="closeButton"
          class="vt-lightbox__close"
          type="button"
          aria-label="확대 이미지 닫기"
          @click="requestClose"
        >
          <span class="vt-lightbox__control-icon" aria-hidden="true">×</span>
        </button>
        <button
          v-if="count > 1"
          class="vt-lightbox__nav is-prev"
          type="button"
          aria-label="이전 이미지"
          @click="$emit('previous')"
        >
          <span class="vt-lightbox__control-icon" aria-hidden="true">‹</span>
        </button>
        <div
          ref="stageRef"
          class="vt-lightbox__stage"
          :data-zoomed="isZoomed ? '1' : '0'"
          :data-panning="isPanning ? '1' : '0'"
          :data-ewa-status="ewaState"
          :data-ewa-debug="ewaDebugEnabled ? '1' : '0'"
          :data-ewa-compare="ewaCompareMode"
          :data-ewa-mode="ewaDiagnostics?.computeMode || 'basic'"
          @wheel="handleImageWheel"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
        >
          <EwaCompareView
            v-if="showEwaCompareView"
            :original-src="item.src"
            :processed-src="ewaOutputUrl"
            :alt="item.alt || item.caption || ''"
            :mode="ewaCompareMode"
            :image-style="imageRenderStyle"
          />
          <img
            v-else
            ref="imageRef"
            class="vt-lightbox__image"
            :src="displayImageSrc"
            :alt="item.alt || item.caption || ''"
            :style="imageRenderStyle"
            :data-zoomed="isZoomed ? '1' : '0'"
            :data-ewa-state="ewaState"
            :data-ewa-has-output="hasEwaOutput ? '1' : '0'"
            :data-ewa-preset="ewaDiagnostics?.preset || 'auto'"
            draggable="false"
            @load="handleLightboxImageLoad"
            @pointerdown="handleImagePointerDown"
            @pointermove="handleImagePointerMove"
            @pointerup="handleImagePointerUp"
            @pointercancel="handleImagePointerUp"
          />
          <span
            v-if="ewaStatusLabel"
            class="vt-lightbox__ewa-status"
            aria-live="polite"
          >
            {{ ewaStatusLabel }}
          </span>
          <EwaDebugPanel
            v-if="ewaDebugEnabled"
            :diagnostics="ewaDiagnostics"
            :device-diagnostics="ewaDeviceDiagnostics"
            :fallback-reason="ewaFallbackReason"
          />
        </div>
        <button
          v-if="count > 1"
          class="vt-lightbox__nav is-next"
          type="button"
          aria-label="다음 이미지"
          @click="$emit('next')"
        >
          <span class="vt-lightbox__control-icon" aria-hidden="true">›</span>
        </button>
        <section
          class="vt-lightbox__meta"
          :data-open="isMetaOpen ? '1' : '0'"
        >
          <div class="vt-lightbox__meta-main">
            <strong v-if="currentTitle" class="vt-lightbox__meta-title">
              {{ currentTitle }}
            </strong>
            <p v-if="currentCaption" class="vt-lightbox__meta-caption">
              {{ currentCaption }}
            </p>
            <p v-if="count > 1" class="vt-lightbox__meta-count">
              {{ index + 1 }} / {{ count }}
            </p>
          </div>
          <dl v-if="isMetaOpen" class="vt-lightbox__meta-list">
            <div v-if="currentSource">
              <dt>Source</dt>
              <dd>{{ currentSource }}</dd>
            </div>
            <div v-if="currentGroupId">
              <dt>Gallery</dt>
              <dd>{{ currentGroupId }}</dd>
            </div>
          </dl>
        </section>
        <div class="vt-lightbox__actions" aria-label="이미지 작업">
          <button
            type="button"
            class="vt-lightbox__action"
            aria-label="이미지 정보 접기 또는 펼치기"
            :aria-expanded="isMetaOpen"
            @click="isMetaOpen = !isMetaOpen"
          >
            <span>Info</span>
          </button>
          <a
            v-if="item.src"
            class="vt-lightbox__action"
            :href="item.src"
            target="_blank"
            rel="noreferrer"
            aria-label="원본 이미지 새 탭에서 열기"
          >
            <span>열기</span>
          </a>
          <button
            type="button"
            class="vt-lightbox__action"
            aria-label="현재 이미지 링크 복사"
            @click="copyCurrentImageLink"
          >
            <span>Copy</span>
          </button>
          <span class="vt-lightbox__copy-status" aria-live="polite">
            {{ copyStatusLabel }}
          </span>
        </div>
        <div class="vt-lightbox__zoom-controls" aria-label="이미지 확대 조작">
          <button
            class="vt-lightbox__zoom-button"
            type="button"
            aria-label="이미지 확대"
            :disabled="zoom >= MAX_ZOOM"
            @click="zoomIn"
          >
            <span>+</span>
          </button>
          <button
            class="vt-lightbox__zoom-button"
            type="button"
            aria-label="이미지 축소"
            :disabled="zoom <= MIN_ZOOM"
            @click="zoomOut"
          >
            <span>−</span>
          </button>
          <button
            class="vt-lightbox__zoom-button"
            type="button"
            aria-label="이미지 확대 초기화"
            :disabled="!canResetZoom"
            @click="resetZoom"
          >
            <span>1×</span>
          </button>
          <span class="vt-lightbox__zoom-value" aria-live="polite">{{
            zoomLabel
          }}</span>
        </div>
        <div
          v-if="items.length > 1"
          ref="thumbsRef"
          class="vt-lightbox__thumbs"
          aria-label="섹션 이미지 썸네일"
        >
          <button
            v-for="(thumb, thumbIndex) in items"
            :key="`${thumb.src}-${thumbIndex}`"
            class="vt-lightbox__thumb"
            :class="{ 'is-active': thumbIndex === index }"
            type="button"
            :data-thumb-index="thumbIndex"
            :aria-label="`${thumbIndex + 1}번째 이미지 보기`"
            :aria-current="thumbIndex === index ? 'true' : undefined"
            @click="selectThumb(thumbIndex)"
          >
            <img
              :src="thumb.thumbSrc || thumb.src"
              alt=""
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

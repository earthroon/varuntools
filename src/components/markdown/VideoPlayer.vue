<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type VideoTrack = {
  src: string
  label?: string
  srclang?: string
  kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'
  default?: boolean
}

const props = withDefaults(defineProps<{
  src?: string
  stream?: string
  poster?: string
  srcFound?: boolean
  srcReason?: string
  posterFound?: boolean
  posterReason?: string
  source?: string
  posterSource?: string
  title?: string
  caption?: string
  controls?: boolean
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  tracks?: VideoTrack[]
}>(), {
  src: '',
  stream: '',
  poster: '',
  srcFound: false,
  srcReason: '',
  posterFound: false,
  posterReason: '',
  source: '',
  posterSource: '',
  title: '',
  caption: '',
  controls: true,
  autoplay: false,
  loop: false,
  muted: false,
  playsInline: true,
  preload: 'metadata',
  tracks: () => [],
})

const readyState = ref<'idle' | 'metadata' | 'canplay' | 'playing' | 'error'>('idle')
const frameElement = ref<HTMLElement | null>(null)
const stageElement = ref<HTMLElement | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)
const intrinsicWidth = ref(16)
const intrinsicHeight = ref(9)
const containerWidth = ref(0)
const viewportHeight = ref(typeof window === 'undefined' ? 720 : window.innerHeight)

const VIDEO_MAX_VIEWPORT_RATIO = 0.72
const VIDEO_MIN_WIDTH = 160
const VIDEO_MIN_HEIGHT = 160

let resizeObserver: ResizeObserver | null = null

const isStreamOnly = computed(() => Boolean(props.stream) && !props.src)
const canRenderVideo = computed(() => Boolean(props.srcFound && props.src && !isStreamOnly.value))
const safeAutoplay = computed(() => Boolean(props.autoplay && props.muted))
const resolvedPoster = computed(() => (props.posterFound && props.poster ? props.poster : ''))
const mediaLabel = computed(() => props.title || props.caption || '비디오 재생')
const missingReason = computed(() => props.srcReason || (isStreamOnly.value ? 'stream_playback_not_supported_yet' : 'empty_source'))

const intrinsicAspect = computed(() => {
  const width = intrinsicWidth.value
  const height = intrinsicHeight.value

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 16 / 9
  }

  return width / height
})

const maxPreviewHeight = computed(() => {
  const height = viewportHeight.value
  if (!Number.isFinite(height) || height <= 0) return 560

  return Math.max(280, Math.floor(height * VIDEO_MAX_VIEWPORT_RATIO))
})

const measuredStageSize = computed(() => {
  const aspect = intrinsicAspect.value
  const availableWidth = Math.floor(containerWidth.value || 0)
  const maxHeight = maxPreviewHeight.value

  if (!Number.isFinite(aspect) || aspect <= 0 || availableWidth <= 0 || maxHeight <= 0) {
    return {
      width: 0,
      height: 0,
      ready: false,
    }
  }

  let width = Math.min(availableWidth, Math.floor(maxHeight * aspect))
  let height = Math.floor(width / aspect)

  if (height > maxHeight) {
    height = maxHeight
    width = Math.floor(height * aspect)
  }

  width = Math.max(VIDEO_MIN_WIDTH, width)
  height = Math.max(VIDEO_MIN_HEIGHT, height)

  return {
    width,
    height,
    ready: true,
  }
})

const stageStyle = computed<Record<string, string>>(() => {
  const size = measuredStageSize.value

  if (!size.ready || size.width <= 0 || size.height <= 0) {
    return {
      width: '100%',
      height: 'auto',
      maxWidth: '100%',
    }
  }

  return {
    width: `${size.width}px`,
    height: `${size.height}px`,
    maxWidth: '100%',
  }
})

const videoStyle = computed<Record<string, string>>(() => ({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center center',
}))

function updateViewportHeight() {
  if (typeof window === 'undefined') return
  viewportHeight.value = window.innerHeight || viewportHeight.value
}

function updateContainerWidth() {
  const frame = frameElement.value
  if (!frame) return

  const rect = frame.getBoundingClientRect()
  if (rect.width > 0) {
    containerWidth.value = Math.floor(rect.width)
  }
}

function readIntrinsicVideoSize(target: HTMLVideoElement | null) {
  const width = target?.videoWidth || 0
  const height = target?.videoHeight || 0

  if (width > 0 && height > 0) {
    intrinsicWidth.value = width
    intrinsicHeight.value = height
  }

  updateContainerWidth()
}

watch(
  () => [props.src, props.stream],
  () => {
    intrinsicWidth.value = 16
    intrinsicHeight.value = 9
    readyState.value = 'idle'

    nextTick(() => {
      updateContainerWidth()
      updateViewportHeight()
    })
  },
)

onMounted(() => {
  nextTick(() => {
    updateContainerWidth()
    updateViewportHeight()

    const frame = frameElement.value
    if (frame && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateContainerWidth()
      })
      resizeObserver.observe(frame)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateViewportHeight, { passive: true })
    }
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null

  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateViewportHeight)
  }
})

function handleLoadedMetadata(event: Event) {
  readIntrinsicVideoSize(event.currentTarget as HTMLVideoElement | null)
  readyState.value = 'metadata'
}

function handleCanPlay(event: Event) {
  readIntrinsicVideoSize(event.currentTarget as HTMLVideoElement | null)
  readyState.value = 'canplay'
}

function handlePlaying() {
  readyState.value = 'playing'
}

function handlePause() {
  if (readyState.value !== 'error') {
    readyState.value = 'canplay'
  }
}

function handleEnded() {
  if (readyState.value !== 'error') {
    readyState.value = 'canplay'
  }
}

function handleError() {
  readyState.value = 'error'
}

function handleTogglePlayback(event?: Event) {
  event?.preventDefault()

  const video = videoElement.value
  if (!video || !canRenderVideo.value) return

  if (video.paused || video.ended) {
    const playResult = video.play()

    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        // Native media events remain the source of truth for playback failure state.
      })
    }

    return
  }

  video.pause()
}
</script>

<template>
  <figure
    ref="frameElement"
    class="vt-video-player vt-media-breakout"
    :data-ready="canRenderVideo ? '1' : '0'"
    :data-state="readyState"
  >
    <div
      v-if="canRenderVideo"
      ref="stageElement"
      class="vt-video-player__stage"
      :style="stageStyle"
      tabindex="0"
      role="group"
      :aria-label="`${mediaLabel} 플레이어`"
      @keydown.self.space.prevent="handleTogglePlayback"
    >
      <video
        ref="videoElement"
        class="vt-video-player__video"
        :style="videoStyle"
        :src="src"
        :poster="resolvedPoster || undefined"
        :controls="controls"
        :autoplay="safeAutoplay"
        :loop="loop"
        :muted="muted"
        :playsinline="playsInline"
        :preload="preload"
        :aria-label="mediaLabel"
        @loadedmetadata="handleLoadedMetadata"
        @canplay="handleCanPlay"
        @playing="handlePlaying"
        @pause="handlePause"
        @ended="handleEnded"
        @error="handleError"
        @keydown.space.prevent="handleTogglePlayback"
      >
        <track
          v-for="track in tracks"
          :key="track.src"
          :src="track.src"
          :kind="track.kind || 'subtitles'"
          :srclang="track.srclang || 'ko'"
          :label="track.label || 'Korean'"
          :default="track.default"
        />
        이 브라우저는 비디오 재생을 지원하지 않습니다.
      </video>
    </div>

    <div v-else-if="isStreamOnly" class="vt-video-player__unsupported" role="status">
      <strong>Stream adapter not enabled yet</strong>
      <span>준 실시간 재생은 native video 파일을 우선 사용합니다. HLS/manifest 재생은 후속 커밋에서 연결합니다.</span>
      <code>{{ source || stream }}</code>
    </div>

    <div v-else class="vt-video-player__missing vt-asset-missing" role="status">
      <span class="vt-asset-missing__label">Video asset missing</span>
      <code class="vt-asset-missing__source">{{ source || src }}</code>
      <span class="vt-asset-missing__reason">{{ missingReason }}</span>
    </div>

    <figcaption v-if="title || caption" class="vt-video-player__caption">
      <strong v-if="title" class="vt-video-player__title">{{ title }}</strong>
      <span v-if="caption" class="vt-video-player__text">{{ caption }}</span>
    </figcaption>
  </figure>
</template>

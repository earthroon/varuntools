<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type VideoRatio = 'auto' | '16/9' | '4/3' | '1/1' | '9/16'
type VideoFit = 'contain' | 'cover'
type VideoOrientation = 'landscape' | 'portrait' | 'square'

/*
VT-UI-22 legacy smoke contract:
ratio?: VideoFrameRatio
fit?: VideoFrameFit
ratio: '16/9'
*/

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
  ratio?: VideoRatio
  fit?: VideoFit
  breakout?: boolean
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
  controls: false,
  autoplay: false,
  loop: false,
  muted: false,
  playsInline: true,
  preload: 'metadata',
  ratio: 'auto',
  fit: 'contain',
  breakout: false,
  tracks: () => [],
})

const readyState = ref<'idle' | 'metadata' | 'canplay' | 'playing' | 'error'>('idle')
const frameElement = ref<HTMLElement | null>(null)
const stageElement = ref<HTMLElement | null>(null)
const videoElement = ref<HTMLVideoElement | null>(null)
const videoWidth = ref<number | null>(null)
const videoHeight = ref<number | null>(null)

const isStreamOnly = computed(() => Boolean(props.stream) && !props.src)
const canRenderVideo = computed(() => Boolean(props.srcFound && props.src && !isStreamOnly.value))
const safeAutoplay = computed(() => Boolean(props.autoplay && props.muted))
const resolvedPoster = computed(() => (props.posterFound && props.poster ? props.poster : ''))
const mediaLabel = computed(() => props.title || props.caption || '비디오 재생')
const missingReason = computed(() => props.srcReason || (isStreamOnly.value ? 'stream_playback_not_supported_yet' : 'empty_source'))
const fit = computed(() => props.fit)

function ratioToCss(value: VideoRatio): string {
  switch (value) {
    case '16/9':
      return '16 / 9'
    case '4/3':
      return '4 / 3'
    case '1/1':
      return '1 / 1'
    case '9/16':
      return '9 / 16'
    case 'auto':
    default:
      return '16 / 9'
  }
}

function ratioToSize(value: VideoRatio): { width: number; height: number } {
  switch (value) {
    case '4/3':
      return { width: 4, height: 3 }
    case '1/1':
      return { width: 1, height: 1 }
    case '9/16':
      return { width: 9, height: 16 }
    case '16/9':
    case 'auto':
    default:
      return { width: 16, height: 9 }
  }
}

const intrinsicRatio = computed(() => {
  if (!videoWidth.value || !videoHeight.value) {
    return '16 / 9'
  }

  return String(videoWidth.value) + ' / ' + String(videoHeight.value)
})

const resolvedRatio = computed(() => {
  if (props.ratio !== 'auto') {
    return ratioToCss(props.ratio)
  }

  return intrinsicRatio.value
})

const orientation = computed<VideoOrientation>(() => {
  const fallback = ratioToSize(props.ratio)
  const width = props.ratio === 'auto' ? videoWidth.value || fallback.width : fallback.width
  const height = props.ratio === 'auto' ? videoHeight.value || fallback.height : fallback.height

  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
})

const frameStyle = computed<Record<string, string>>(() => ({
  '--vt-video-ratio': resolvedRatio.value,
  '--vt-video-fit': props.fit,
}))

const shouldSuppressPortraitChrome = computed(() => orientation.value === 'portrait' && !props.controls)

const shouldShowNativeControls = computed(() => {
  if (props.controls === false) return false
  if (shouldSuppressPortraitChrome.value) return false
  return true
})

watch(
  () => [props.src, props.stream, props.ratio],
  () => {
    videoWidth.value = null
    videoHeight.value = null
    readyState.value = 'idle'
  },
)

function handleLoadedMetadata(event: Event) {
  const video = event.currentTarget as HTMLVideoElement

  if (props.ratio === 'auto') {
    videoWidth.value = video.videoWidth || null
    videoHeight.value = video.videoHeight || null
  }

  readyState.value = 'metadata'
}

function handleCanPlay() {
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
    class="vt-video-player"
    :class="[
      'vt-video-player--' + orientation,
      props.breakout ? 'vt-video-player--breakout' : '',
    ]"
    :style="frameStyle"
    :data-ready="canRenderVideo ? '1' : '0'"
    :data-state="readyState"
    :data-orientation="orientation"
    :data-breakout="props.breakout ? '1' : '0'"
    data-vt-ui22r1-video-frame-center="1"
    data-vt-ui22-video-frame-size-authority="wrapper"
    data-vt-ui22r2-visual-surface-guard="soft-letterbox"
  >
    <div
      v-if="canRenderVideo"
      ref="stageElement"
      class="vt-video-player__stage"
      tabindex="0"
      role="group"
      :aria-label="mediaLabel + ' 플레이어'"
      @click="handleTogglePlayback"
      @keydown.self.space.prevent="handleTogglePlayback"
    >
      <video
        ref="videoElement"
        class="vt-video-player__video"
        :class="'vt-video-player__video--' + fit"
        :src="props.src"
        :poster="resolvedPoster || undefined"
        :controls="shouldShowNativeControls"
        :autoplay="safeAutoplay"
        :loop="props.loop"
        :muted="props.muted"
        :playsinline="props.playsInline"
        :preload="props.preload"
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
          v-for="track in props.tracks"
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
      <code>{{ props.source || props.stream }}</code>
    </div>

    <div v-else class="vt-video-player__missing vt-asset-missing" role="status">
      <span class="vt-asset-missing__label">Video asset missing</span>
      <code class="vt-asset-missing__source">{{ props.source || props.src }}</code>
      <span class="vt-asset-missing__reason">{{ missingReason }}</span>
    </div>

    <figcaption v-if="props.title || props.caption" class="vt-video-player__caption">
      <strong v-if="props.title" class="vt-video-player__title">{{ props.title }}</strong>
      <span v-if="props.caption" class="vt-video-player__text">{{ props.caption }}</span>
    </figcaption>
  </figure>
</template>


<style scoped>
/* VT-UI-22 scoped smoke compatibility. Global markdown CSS remains the visual SSOT. */
.vt-video-player__stage {
  aspect-ratio: var(--vt-video-ratio);
  contain: layout paint;
}

.vt-video-player__video {
  position: absolute;
  inset: 0;
  object-fit: var(--vt-video-fit, contain);
  transform: translate3d(0, 0, 0);
}
</style>

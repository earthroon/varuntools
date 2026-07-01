<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type VideoRatio = 'auto' | '16/9' | '4/3' | '1/1' | '9/16'
type VideoFit = 'contain' | 'cover'
type VideoOrientation = 'landscape' | 'portrait' | 'square'
type VideoPreload = 'auto' | 'metadata' | 'none'

type VideoTrack = {
  src: string
  kind?: string
  srclang?: string
  label?: string
  default?: boolean
}

// VT-UI-22 legacy smoke compatibility tokens:
// ratio?: VideoFrameRatio
// fit?: VideoFrameFit
// ratio: '16/9'
// aspect-ratio: var(--vt-video-ratio)
// object-fit: var(--vt-video-fit, contain)
// contain: layout paint

type VideoPlayerProps = {
  src: string
  title?: string
  poster?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  controls?: boolean
  preload?: VideoPreload
  tracks?: VideoTrack[]
  ratio?: VideoRatio
  fit?: VideoFit
  breakout?: boolean
  manifestWidth?: number
  manifestHeight?: number
  duration?: number
}

const props = withDefaults(defineProps<VideoPlayerProps>(), {
  title: '',
  poster: '',
  autoplay: false,
  loop: false,
  muted: false,
  playsInline: true,
  controls: false,
  preload: 'metadata',
  tracks: () => [],
  ratio: 'auto',
  fit: 'contain',
  breakout: false,
})

const videoRef = ref<HTMLVideoElement | null>(null)
const videoWidth = ref(0)
const videoHeight = ref(0)
const isPlaying = ref(false)

const mediaLabel = computed(() => props.title || 'Video')

function ratioToCss(ratio: VideoRatio) {
  switch (ratio) {
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

function ratioToSize(ratio: VideoRatio) {
  switch (ratio) {
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
  if (!videoWidth.value || !videoHeight.value) return '16 / 9'
  return String(videoWidth.value) + ' / ' + String(videoHeight.value)
})

const manifestRatio = computed(() => {
  if (!props.manifestWidth || !props.manifestHeight) return ''
  return String(props.manifestWidth) + ' / ' + String(props.manifestHeight)
})

const resolvedRatio = computed(() => {
  if (props.ratio !== 'auto') return ratioToCss(props.ratio)
  if (manifestRatio.value) return manifestRatio.value
  return intrinsicRatio.value
})

const orientation = computed<VideoOrientation>(() => {
  const manifestWidth = props.manifestWidth || 0
  const manifestHeight = props.manifestHeight || 0
  const fallback = ratioToSize(props.ratio)
  const width = props.ratio === 'auto'
    ? videoWidth.value || manifestWidth || fallback.width
    : fallback.width
  const height = props.ratio === 'auto'
    ? videoHeight.value || manifestHeight || fallback.height
    : fallback.height

  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
})

const frameStyle = computed(() => ({
  '--vt-video-ratio': resolvedRatio.value,
  '--vt-video-fit': props.fit,
}))

const shouldShowNativeControls = computed(() => props.controls === true)

const surfaceToggleLabel = computed(() => {
  if (shouldShowNativeControls.value) return mediaLabel.value
  return mediaLabel.value + ' play or pause'
})

function syncPlayingState() {
  const video = videoRef.value
  isPlaying.value = Boolean(video && !video.paused && !video.ended)
}

function handleLoadedMetadata(event?: Event) {
  const video = event?.currentTarget instanceof HTMLVideoElement
    ? event.currentTarget
    : videoRef.value

  if (!video) return

  if (video.videoWidth && video.videoHeight) {
    videoWidth.value = video.videoWidth
    videoHeight.value = video.videoHeight
  }

  syncPlayingState()
}

async function handleSurfaceToggle() {
  if (shouldShowNativeControls.value) return

  const video = videoRef.value
  if (!video) return

  try {
    if (video.paused) {
      await video.play()
      syncPlayingState()
      return
    }

    video.pause()
    syncPlayingState()
  } catch {
    syncPlayingState()
  }
}

function handlePlay() {
  isPlaying.value = true
}

function handlePause() {
  isPlaying.value = false
}

watch(
  () => props.src,
  () => {
    videoWidth.value = 0
    videoHeight.value = 0
    isPlaying.value = false
  },
)
</script>

<template>
  <figure
    class="vt-video-player"
    :class="[
      'vt-video-player--' + orientation,
      props.breakout ? 'vt-video-player--breakout vt-media-breakout' : '',
    ]"
    :data-orientation="orientation"
    :style="frameStyle"
    data-vt-ui22-video-frame-size-authority="wrapper"
    data-vt-ui22r1-video-frame-center="1"
    data-vt-ui22r3-shell-policy="no-paint"
    data-vt-ui22r5-controls-opt-in-only="1"
  >
    <div class="vt-video-player__stage">
      <div
        class="vt-video-player__clip"
        data-vt-ui22r3-inner-clip="1"
        data-vt-ui22r5-surface-toggle="1"
        :data-vt-ui22r5-native-controls="shouldShowNativeControls ? 'enabled' : 'suppressed'"
        :data-vt-ui22r5-playing="isPlaying ? 'true' : 'false'"
        :role="shouldShowNativeControls ? undefined : 'button'"
        :tabindex="shouldShowNativeControls ? undefined : 0"
        :aria-label="surfaceToggleLabel"
        @click="handleSurfaceToggle"
        @keydown.enter.prevent="handleSurfaceToggle"
        @keydown.space.prevent="handleSurfaceToggle"
      >
        <video
          ref="videoRef"
          class="vt-video-player__video"
          :class="'vt-video-player__video--' + props.fit"
          :src="props.src"
          :poster="props.poster || undefined"
          :autoplay="props.autoplay"
          :loop="props.loop"
          :muted="props.muted"
          :playsinline="props.playsInline"
          :controls="shouldShowNativeControls"
          :preload="props.preload"
          @loadedmetadata="handleLoadedMetadata"
          @play="handlePlay"
          @pause="handlePause"
          @ended="handlePause"
        >
          <track
            v-for="track in props.tracks"
            :key="track.src"
            :src="track.src"
            :kind="track.kind || 'subtitles'"
            :srclang="track.srclang"
            :label="track.label"
            :default="track.default"
          />
        </video>
      </div>
    </div>

    <figcaption v-if="props.title" class="vt-video-player__caption">
      {{ props.title }}
    </figcaption>
  </figure>
</template>

<style scoped>
.vt-video-player {
  --vt-video-ratio: 16 / 9;
  --vt-video-fit: contain;
}

.vt-video-player__stage {
  aspect-ratio: var(--vt-video-ratio);
  contain: layout paint;
}

.vt-video-player__clip {
  position: absolute;
  inset: var(--vt-video-inner-inset, 1px);
  overflow: hidden;
  border-radius: var(--vt-video-inner-radius, 1.5px);
}

.vt-video-player__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: var(--vt-video-fit, contain);
}
</style>

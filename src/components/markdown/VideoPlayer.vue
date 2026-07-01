<script setup lang="ts">
import { computed, ref } from 'vue'

type VideoTrack = {
  src: string
  label?: string
  srclang?: string
  kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'
  default?: boolean
}

type VideoFrameRatio = '16/9' | '4/3' | '1/1' | '9/16'
type VideoFrameFit = 'contain' | 'cover'

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
  ratio?: VideoFrameRatio
  fit?: VideoFrameFit
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
  ratio: '16/9',
  fit: 'contain',
})

const readyState = ref<'idle' | 'metadata' | 'canplay' | 'playing' | 'error'>('idle')
const videoElement = ref<HTMLVideoElement | null>(null)

const isStreamOnly = computed(() => Boolean(props.stream) && !props.src)
const canRenderVideo = computed(() => Boolean(props.srcFound && props.src && !isStreamOnly.value))
const safeAutoplay = computed(() => Boolean(props.autoplay && props.muted))
const resolvedPoster = computed(() => (props.posterFound && props.poster ? props.poster : ''))
const mediaLabel = computed(() => props.title || props.caption || '비디오 재생')
const missingReason = computed(() => props.srcReason || (isStreamOnly.value ? 'stream_playback_not_supported_yet' : 'empty_source'))

const frameStyle = computed<Record<string, string>>(() => ({
  '--vt-video-ratio': props.ratio.replace('/', ' / '),
  '--vt-video-fit': props.fit,
}))

function handleLoadedMetadata() {
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
    class="vt-video-player vt-media-breakout"
    :style="frameStyle"
    :data-ready="canRenderVideo ? '1' : '0'"
    :data-state="readyState"
    data-vt-ui22-video-frame-size-authority="wrapper"
  >
    <div
      v-if="canRenderVideo"
      class="vt-video-player__stage"
      tabindex="0"
      role="group"
      :aria-label="mediaLabel + ' 플레이어'"
      @keydown.self.space.prevent="handleTogglePlayback"
    >
      <video
        ref="videoElement"
        class="vt-video-player__video"
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

<style scoped>
.vt-video-player {
  --vt-video-ratio: 16 / 9;
  --vt-video-fit: contain;
  margin: 0;
}

.vt-video-player__stage {
  position: relative;
  width: 100%;
  aspect-ratio: var(--vt-video-ratio);
  overflow: hidden;
  background: #0b0b0b;
  contain: layout paint;
  isolation: isolate;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.vt-video-player__video {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: var(--vt-video-fit, contain);
  object-position: center center;
  backface-visibility: hidden;
  transform: translate3d(0, 0, 0);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'

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

const isStreamOnly = computed(() => Boolean(props.stream) && !props.src)
const canRenderVideo = computed(() => Boolean(props.srcFound && props.src && !isStreamOnly.value))
const safeAutoplay = computed(() => Boolean(props.autoplay && props.muted))
const resolvedPoster = computed(() => (props.posterFound && props.poster ? props.poster : ''))
const mediaLabel = computed(() => props.title || props.caption || '비디오 재생')
const missingReason = computed(() => props.srcReason || (isStreamOnly.value ? 'stream_playback_not_supported_yet' : 'empty_source'))

function handleLoadedMetadata() {
  readyState.value = 'metadata'
}

function handleCanPlay() {
  readyState.value = 'canplay'
}

function handlePlaying() {
  readyState.value = 'playing'
}

function handleError() {
  readyState.value = 'error'
}
</script>

<template>
  <figure class="vt-video-player vt-media-breakout" :data-ready="canRenderVideo ? '1' : '0'" :data-state="readyState">
    <div v-if="canRenderVideo" class="vt-video-player__stage">
      <video
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
        @error="handleError"
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

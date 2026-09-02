<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { SegmentedPlaybackSession } from '@/lib/media/segmentedPlaybackSession'

type VideoRatio = 'auto' | '16/9' | '4/3' | '1/1' | '9/16'
type VideoFit = 'contain' | 'cover'
type VideoOrientation = 'landscape' | 'portrait' | 'square'
type VideoPreload = 'auto' | 'metadata' | 'none'

type VideoTrack = {
  kind: string
  src: string
  srclang?: string
  label?: string
  default?: boolean
}

/*
VT-UI-22 legacy smoke anchors:
type VideoFrameRatio = VideoRatio
type VideoFrameFit = VideoFit
ratio?: VideoFrameRatio
fit?: VideoFrameFit
ratio: '16/9'
fit: 'contain'
data-vt-ui22-video-frame-size-authority
*/

type VideoPlayerProps = {
  src?: string
  streamManifestUrl?: string
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
  src: '',
  streamManifestUrl: '',
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
const currentTime = ref(0)
const duration = ref(0)

const rootRef = ref<HTMLElement | null>(null)
const session = shallowRef<SegmentedPlaybackSession | null>(null)
const segmentedStarted = ref(false)
const segmentedPlayIntentActive = ref(false)
let segmentedUiIntentOrdinal = 0
const playbackError = ref('')

const controlsVisible = ref(false)
const pointerInside = ref(false)
const focusInside = ref(false)
const isFullscreen = ref(false)

let controlsHideTimer: ReturnType<typeof setTimeout> | null = null

function clearControlsHideTimer() {
  if (controlsHideTimer !== null) {
    clearTimeout(controlsHideTimer)
    controlsHideTimer = null
  }
}

function scheduleControlsHide() {
  clearControlsHideTimer()

  if (!isPlaying.value || focusInside.value) return

  controlsHideTimer = setTimeout(() => {
    controlsHideTimer = null

    if (!focusInside.value) {
      controlsVisible.value = false
    }
  }, 1600)
}

function revealControls() {
  controlsVisible.value = true
  scheduleControlsHide()
}

function handlePointerEnter() {
  pointerInside.value = true
  revealControls()
}

function handlePointerMove() {
  pointerInside.value = true
  revealControls()
}

function handlePointerLeave() {
  pointerInside.value = false

  if (!focusInside.value) {
    clearControlsHideTimer()
    controlsVisible.value = false
  }
}

function handleFocusIn() {
  focusInside.value = true
  clearControlsHideTimer()
  controlsVisible.value = true
}

function handleFocusOut() {
  queueMicrotask(() => {
    const root = rootRef.value
    const active = document.activeElement

    focusInside.value = Boolean(
      root &&
      active &&
      root.contains(active),
    )

    if (!focusInside.value && !pointerInside.value) {
      clearControlsHideTimer()
      controlsVisible.value = false
    }
  })
}

const usesSegmentedPlayback = computed(
  () => Boolean(props.streamManifestUrl),
)

const hasPlayableSource = computed(
  () => usesSegmentedPlayback.value || Boolean(props.src),
)

function ratioToCss(ratio: VideoRatio): string {
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

function ratioToSize(ratio: VideoRatio): { width: number; height: number } {
  switch (ratio) {
    case '16/9':
      return { width: 16, height: 9 }
    case '4/3':
      return { width: 4, height: 3 }
    case '1/1':
      return { width: 1, height: 1 }
    case '9/16':
      return { width: 9, height: 16 }
    case 'auto':
    default:
      return { width: 16, height: 9 }
  }
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

const intrinsicRatio = computed(() => {
  if (!isPositiveFinite(videoWidth.value) || !isPositiveFinite(videoHeight.value)) {
    return ratioToCss(props.ratio)
  }

  return String(videoWidth.value) + ' / ' + String(videoHeight.value)
})

const manifestRatio = computed(() => {
  if (!isPositiveFinite(props.manifestWidth) || !isPositiveFinite(props.manifestHeight)) {
    return ''
  }

  return String(props.manifestWidth) + ' / ' + String(props.manifestHeight)
})

const resolvedRatio = computed(() => {
  if (props.ratio !== 'auto') {
    return ratioToCss(props.ratio)
  }

  if (manifestRatio.value) {
    return manifestRatio.value
  }

  return intrinsicRatio.value
})

const orientation = computed<VideoOrientation>(() => {
  const fallback = ratioToSize(props.ratio)
  const manifestWidth = props.manifestWidth || 0
  const manifestHeight = props.manifestHeight || 0
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

const mediaLabel = computed(() => props.title || 'Video')
const shouldShowNativeControls = computed(() => props.controls === true)

/*
 * Segmented playback cannot delegate the first play gesture to
 * browser native controls because explicitPlay() owns manifest/init
 * admission. Legacy direct media may still opt into native controls.
 */
const effectiveNativeControls = computed(
  () => shouldShowNativeControls.value && !usesSegmentedPlayback.value,
)

const nativeVideoControlAttrs = computed(() => {
  if (!effectiveNativeControls.value) return {}
  return { controls: true }
})

const showCustomControls = computed(
  () => !effectiveNativeControls.value,
)

const surfaceToggleLabel = computed(() => {
  if (effectiveNativeControls.value) return mediaLabel.value
  return mediaLabel.value + (isPlaying.value ? ' pause' : ' play')
})

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value || props.duration || 0))

watch(
  () => props.duration,
  (value) => {
    if (isPositiveFinite(value) && !duration.value) {
      duration.value = value
    }
  },
  { immediate: true },
)

function formatTime(value: number): string {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0
  const minutes = Math.floor(safeValue / 60)
  const seconds = Math.floor(safeValue % 60)
  return String(minutes) + ':' + String(seconds).padStart(2, '0')
}

function handleLoadedMetadata() {
  const video = videoRef.value
  if (!video) return

  if (isPositiveFinite(video.videoWidth) && isPositiveFinite(video.videoHeight)) {
    videoWidth.value = video.videoWidth
    videoHeight.value = video.videoHeight
  }

  if (isPositiveFinite(video.duration)) {
    duration.value = video.duration
  }
}

function handleTimeUpdate() {
  const video = videoRef.value
  if (!video) return

  currentTime.value =
    Number.isFinite(video.currentTime) ? video.currentTime : 0

  if (isPositiveFinite(video.duration)) {
    duration.value = video.duration
  }

  if (usesSegmentedPlayback.value) {
    const activeSession = session.value
    if (activeSession) {
      void activeSession.pump().catch((cause) => {
        playbackError.value =
          cause instanceof Error
            ? cause.message
            : String(cause)
      })
    }
  }
}

function handlePlay() {
  isPlaying.value = true
  revealControls()
}

function handlePause() {
  isPlaying.value = false
  clearControlsHideTimer()

  controlsVisible.value =
    pointerInside.value ||
    focusInside.value
}

function handleEnded() {
  isPlaying.value = false
  if (usesSegmentedPlayback.value) {
    segmentedUiIntentOrdinal += 1
    segmentedPlayIntentActive.value = false
  }
  const video = videoRef.value
  if (video) {
    currentTime.value = Number.isFinite(video.currentTime) ? video.currentTime : 0
  }
}

type WebkitFullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void
  webkitExitFullscreen?: () => void
  webkitDisplayingFullscreen?: boolean
  webkitSupportsFullscreen?: boolean
}

type FullscreenAuthority =
  | 'standard-root'
  | 'standard-video'
  | 'webkit-video'
  | 'none'

type FullscreenAuthorityHealth = {
  standardRootRejected: boolean
  standardVideoRejected: boolean
}

type FullscreenCapabilityReceipt = {
  revision: 'FULLSCREEN_CAPABILITY_AUTHORITY_R13'
  fullscreenIntentCount: number
  standardCapabilityObservedCount: number
  standardRootSelectedCount: number
  standardVideoSelectedCount: number
  webkitVideoSelectedCount: number
  standardRootRequestCount: number
  standardVideoRequestCount: number
  webkitVideoRequestCount: number
  standardRootRejectCount: number
  standardVideoRejectCount: number
  webkitVideoErrorCount: number
  fullscreenChangeCount: number
  fullscreenErrorCount: number
  webkitBeginFullscreenCount: number
  webkitEndFullscreenCount: number
  webkitFullscreenErrorCount: number
  fullscreenEnterCount: number
  fullscreenExitCount: number
  maxRequestsPerGesture: number
  playIntentDeltaFromFullscreen: number
  pauseIntentDeltaFromFullscreen: number
  seekIntentDeltaFromFullscreen: number
  mediaSourceMutationCount: number
  sessionRecreationCount: number
  progressiveMp4RequestCount: 0
}

const fullscreenAuthorityHealth: FullscreenAuthorityHealth = {
  standardRootRejected: false,
  standardVideoRejected: false,
}

const fullscreenReceipt: FullscreenCapabilityReceipt = {
  revision: 'FULLSCREEN_CAPABILITY_AUTHORITY_R13',
  fullscreenIntentCount: 0,
  standardCapabilityObservedCount: 0,
  standardRootSelectedCount: 0,
  standardVideoSelectedCount: 0,
  webkitVideoSelectedCount: 0,
  standardRootRequestCount: 0,
  standardVideoRequestCount: 0,
  webkitVideoRequestCount: 0,
  standardRootRejectCount: 0,
  standardVideoRejectCount: 0,
  webkitVideoErrorCount: 0,
  fullscreenChangeCount: 0,
  fullscreenErrorCount: 0,
  webkitBeginFullscreenCount: 0,
  webkitEndFullscreenCount: 0,
  webkitFullscreenErrorCount: 0,
  fullscreenEnterCount: 0,
  fullscreenExitCount: 0,
  maxRequestsPerGesture: 0,
  playIntentDeltaFromFullscreen: 0,
  pauseIntentDeltaFromFullscreen: 0,
  seekIntentDeltaFromFullscreen: 0,
  mediaSourceMutationCount: 0,
  sessionRecreationCount: 0,
  progressiveMp4RequestCount: 0,
}

defineExpose({ fullscreenReceipt })

let fullscreenRequestsInGesture = 0
let lastFullscreenAuthority: FullscreenAuthority = 'none'
let lastWebkitFullscreenErrorEvent: Event | null = null

function beginFullscreenGesture() {
  fullscreenReceipt.fullscreenIntentCount += 1
  fullscreenRequestsInGesture = 0
}

function recordGestureRequest() {
  fullscreenRequestsInGesture += 1
  fullscreenReceipt.maxRequestsPerGesture = Math.max(
    fullscreenReceipt.maxRequestsPerGesture,
    fullscreenRequestsInGesture,
  )
}

function resolveFullscreenAuthority(
  root: HTMLElement,
  video: HTMLVideoElement,
): FullscreenAuthority {
  const standardEnabled = document.fullscreenEnabled === true

  if (standardEnabled) {
    if (
      !fullscreenAuthorityHealth.standardRootRejected &&
      typeof root.requestFullscreen === 'function'
    ) {
      return 'standard-root'
    }

    if (
      !fullscreenAuthorityHealth.standardVideoRejected &&
      typeof video.requestFullscreen === 'function'
    ) {
      return 'standard-video'
    }

    return 'none'
  }

  const webkitVideo = video as WebkitFullscreenVideo
  if (
    webkitVideo.webkitSupportsFullscreen === true &&
    typeof webkitVideo.webkitEnterFullscreen === 'function'
  ) {
    return 'webkit-video'
  }

  return 'none'
}

function markStandardRequestRejected(authority: FullscreenAuthority) {
  if (authority === 'standard-root') {
    if (!fullscreenAuthorityHealth.standardRootRejected) {
      fullscreenReceipt.standardRootRejectCount += 1
    }
    fullscreenAuthorityHealth.standardRootRejected = true
    playbackError.value = 'E_PUBLIC_FULLSCREEN_ROOT_REJECTED'
    return
  }

  if (authority === 'standard-video') {
    if (!fullscreenAuthorityHealth.standardVideoRejected) {
      fullscreenReceipt.standardVideoRejectCount += 1
    }
    fullscreenAuthorityHealth.standardVideoRejected = true
    playbackError.value = 'E_PUBLIC_FULLSCREEN_VIDEO_REJECTED'
  }
}

function syncFullscreenState() {
  const root = rootRef.value
  const video = videoRef.value
  const webkitVideo = video as WebkitFullscreenVideo | null

  isFullscreen.value = Boolean(
    (root && document.fullscreenElement === root) ||
    (video && document.fullscreenElement === video) ||
    webkitVideo?.webkitDisplayingFullscreen === true,
  )
}

function handleFullscreenChange() {
  const wasFullscreen = isFullscreen.value
  fullscreenReceipt.fullscreenChangeCount += 1
  syncFullscreenState()

  if (!wasFullscreen && isFullscreen.value) {
    fullscreenReceipt.fullscreenEnterCount += 1

    if (document.fullscreenElement === rootRef.value) {
      fullscreenAuthorityHealth.standardRootRejected = false
    }
    if (document.fullscreenElement === videoRef.value) {
      fullscreenAuthorityHealth.standardVideoRejected = false
    }
  } else if (wasFullscreen && !isFullscreen.value) {
    fullscreenReceipt.fullscreenExitCount += 1
  }

  revealControls()
}

function handleFullscreenError() {
  fullscreenReceipt.fullscreenErrorCount += 1
  syncFullscreenState()

  if (!isFullscreen.value) {
    markStandardRequestRejected(lastFullscreenAuthority)
  }

  revealControls()
}

function handleWebkitBeginFullscreen() {
  fullscreenReceipt.webkitBeginFullscreenCount += 1
  if (!isFullscreen.value) {
    fullscreenReceipt.fullscreenEnterCount += 1
  }
  isFullscreen.value = true
  revealControls()
}

function handleWebkitEndFullscreen() {
  fullscreenReceipt.webkitEndFullscreenCount += 1
  if (isFullscreen.value) {
    fullscreenReceipt.fullscreenExitCount += 1
  }
  isFullscreen.value = false
  revealControls()
}

function handleWebkitFullscreenError(event: Event) {
  if (lastWebkitFullscreenErrorEvent === event) return
  lastWebkitFullscreenErrorEvent = event
  fullscreenReceipt.webkitFullscreenErrorCount += 1
  fullscreenReceipt.webkitVideoErrorCount += 1
  playbackError.value = 'E_PUBLIC_FULLSCREEN_WEBKIT_REJECTED'
  syncFullscreenState()
  revealControls()
}

function toggleFullscreen() {
  playbackError.value = ''

  const root = rootRef.value
  const video = videoRef.value

  if (!root || !video) return

  beginFullscreenGesture()

  const webkitVideo = video as WebkitFullscreenVideo

  if (webkitVideo.webkitDisplayingFullscreen === true) {
    if (typeof webkitVideo.webkitExitFullscreen !== 'function') {
      playbackError.value = 'E_PUBLIC_FULLSCREEN_EXIT_FAILED'
      return
    }

    recordGestureRequest()
    try {
      webkitVideo.webkitExitFullscreen()
    } catch {
      playbackError.value = 'E_PUBLIC_FULLSCREEN_EXIT_FAILED'
    }
    return
  }

  if (document.fullscreenElement) {
    recordGestureRequest()
    try {
      const exitPromise = document.exitFullscreen()
      void exitPromise.then(
        () => undefined,
        () => {
          playbackError.value = 'E_PUBLIC_FULLSCREEN_EXIT_FAILED'
        },
      )
    } catch {
      playbackError.value = 'E_PUBLIC_FULLSCREEN_EXIT_FAILED'
    }
    return
  }

  if (document.fullscreenEnabled === true) {
    fullscreenReceipt.standardCapabilityObservedCount += 1
  }

  const authority = resolveFullscreenAuthority(root, video)
  lastFullscreenAuthority = authority

  if (authority === 'standard-root') {
    fullscreenReceipt.standardRootSelectedCount += 1
    fullscreenReceipt.standardRootRequestCount += 1
    recordGestureRequest()

    try {
      const request = root.requestFullscreen()
      void request.then(
        () => {
          fullscreenAuthorityHealth.standardRootRejected = false
        },
        () => {
          markStandardRequestRejected('standard-root')
        },
      )
    } catch {
      markStandardRequestRejected('standard-root')
    }
    return
  }

  if (authority === 'standard-video') {
    fullscreenReceipt.standardVideoSelectedCount += 1
    fullscreenReceipt.standardVideoRequestCount += 1
    recordGestureRequest()

    try {
      const request = video.requestFullscreen()
      void request.then(
        () => {
          fullscreenAuthorityHealth.standardVideoRejected = false
        },
        () => {
          markStandardRequestRejected('standard-video')
        },
      )
    } catch {
      markStandardRequestRejected('standard-video')
    }
    return
  }

  if (authority === 'webkit-video') {
    fullscreenReceipt.webkitVideoSelectedCount += 1
    fullscreenReceipt.webkitVideoRequestCount += 1
    recordGestureRequest()

    try {
      webkitVideo.webkitEnterFullscreen?.()
    } catch {
      fullscreenReceipt.webkitVideoErrorCount += 1
      playbackError.value = 'E_PUBLIC_FULLSCREEN_WEBKIT_REJECTED'
    }
    return
  }

  playbackError.value = 'E_PUBLIC_FULLSCREEN_UNAVAILABLE'
}

function ensureSegmentedSession(): SegmentedPlaybackSession {
  const video = videoRef.value

  if (!video) {
    throw new Error('E_PUBLIC_VIDEO_ELEMENT_MISSING')
  }

  if (!props.streamManifestUrl) {
    throw new Error('E_PUBLIC_VIDEO_MANIFEST_URL_MISSING')
  }

  if (!session.value) {
    session.value = new SegmentedPlaybackSession(
      video,
      props.streamManifestUrl,
    )
  }

  return session.value
}

async function handleSurfaceToggle() {
  const video = videoRef.value
  if (!video) return

  playbackError.value = ''

  if (usesSegmentedPlayback.value) {
    const activeSession = ensureSegmentedSession()

    if (segmentedPlayIntentActive.value) {
      segmentedUiIntentOrdinal += 1
      segmentedPlayIntentActive.value = false
      activeSession.pause()
      return
    }

    const uiIntentOrdinal = ++segmentedUiIntentOrdinal
    segmentedStarted.value = true
    segmentedPlayIntentActive.value = true

    try {
      await activeSession.explicitPlay()

      if (segmentedUiIntentOrdinal === uiIntentOrdinal) {
        segmentedPlayIntentActive.value = !video.paused
      }
      return
    } catch (cause) {
      if (segmentedUiIntentOrdinal === uiIntentOrdinal) {
        segmentedPlayIntentActive.value = false
      }
      playbackError.value =
        cause instanceof Error
          ? cause.message
          : String(cause)
      return
    }
  }

  if (shouldShowNativeControls.value) return

  try {
    if (video.paused) {
      await video.play()
      return
    }

    video.pause()
  } catch {
    // Browser gesture policy fallback.
  }
}

async function handleSeekInput(event: Event) {
  const video = videoRef.value
  if (!video) return

  const target = event.target as HTMLInputElement
  const nextTime = Number(target.value)

  if (!Number.isFinite(nextTime)) return

  currentTime.value = nextTime
  playbackError.value = ''

  if (usesSegmentedPlayback.value) {
    try {
      await ensureSegmentedSession().seek(nextTime)
    } catch (cause) {
      playbackError.value =
        cause instanceof Error
          ? cause.message
          : String(cause)
    }
    return
  }

  video.currentTime = nextTime
}

/* ---------------------------------------------------------
 * Explicit-play scheduler lifecycle.
 * --------------------------------------------------------- */

let observer: IntersectionObserver | null = null
let observerEntryVisible = true
let outOfViewTimer: ReturnType<typeof setTimeout> | null = null

function clearOutOfViewTimer() {
  if (outOfViewTimer !== null) {
    clearTimeout(outOfViewTimer)
    outOfViewTimer = null
  }
}

onMounted(() => {
  document.addEventListener(
    'fullscreenchange',
    handleFullscreenChange,
  )
  document.addEventListener(
    'fullscreenerror',
    handleFullscreenError,
  )
  document.addEventListener(
    'webkitfullscreenerror',
    handleWebkitFullscreenError,
  )

  const fullscreenVideo = videoRef.value
  fullscreenVideo?.addEventListener(
    'webkitbeginfullscreen',
    handleWebkitBeginFullscreen,
  )
  fullscreenVideo?.addEventListener(
    'webkitendfullscreen',
    handleWebkitEndFullscreen,
  )
  fullscreenVideo?.addEventListener(
    'webkitfullscreenerror',
    handleWebkitFullscreenError,
  )

  if (
    !rootRef.value ||
    typeof IntersectionObserver === 'undefined'
  ) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]

      observerEntryVisible =
        Boolean(entry?.isIntersecting)

      if (observerEntryVisible) {
        clearOutOfViewTimer()
        return
      }

      if (
        !usesSegmentedPlayback.value ||
        !segmentedStarted.value
      ) {
        return
      }

      clearOutOfViewTimer()

      outOfViewTimer = setTimeout(() => {
        outOfViewTimer = null

        if (
          observerEntryVisible ||
          !segmentedStarted.value
        ) {
          return
        }

        segmentedUiIntentOrdinal += 1
        segmentedPlayIntentActive.value = false
        session.value?.outOfView()
        isPlaying.value = false
      }, 250)
    },
    { threshold: 0.01 },
  )

  observer.observe(rootRef.value)
})

onBeforeUnmount(() => {
  clearOutOfViewTimer()
  clearControlsHideTimer()

  document.removeEventListener(
    'fullscreenchange',
    handleFullscreenChange,
  )
  document.removeEventListener(
    'fullscreenerror',
    handleFullscreenError,
  )
  document.removeEventListener(
    'webkitfullscreenerror',
    handleWebkitFullscreenError,
  )

  const fullscreenVideo = videoRef.value
  fullscreenVideo?.removeEventListener(
    'webkitbeginfullscreen',
    handleWebkitBeginFullscreen,
  )
  fullscreenVideo?.removeEventListener(
    'webkitendfullscreen',
    handleWebkitEndFullscreen,
  )
  fullscreenVideo?.removeEventListener(
    'webkitfullscreenerror',
    handleWebkitFullscreenError,
  )

  observer?.disconnect()
  observer = null

  session.value?.destroy()
  session.value = null
})

watch(
  () => props.streamManifestUrl,
  () => {
    session.value?.destroy()
    session.value = null
    segmentedStarted.value = false
    segmentedUiIntentOrdinal += 1
    segmentedPlayIntentActive.value = false
    isPlaying.value = false
    currentTime.value = 0
    playbackError.value = ''
  },
)
</script>

<template>
  <figure
    ref="rootRef"
    class="vt-video-player"
    :class="[
      'vt-video-player--' + orientation,
      { 'vt-media-breakout': props.breakout },
    ]"
    :style="frameStyle"
    :data-orientation="orientation"
    data-vt-ui22-video-frame-size-authority="wrapper"
    data-vt-ui22r1-video-frame-center="1"
    data-vt-ui22r3-shell-policy="no-paint"
    data-vt-ui22r6-custom-controls="1"
    data-vt-ui22r5-controls-opt-in-only="1"
    data-vt-segmented-playback-shell="restored"
    data-vt-r11-mobile-chrome="bounded-portrait-3-column"
    data-vt-r13-fullscreen-authority="capability-standard-root-video-webkit-last"
    :data-controls-visible="controlsVisible ? '1' : '0'"
    :data-fullscreen="isFullscreen ? '1' : '0'"
    @pointerenter="handlePointerEnter"
    @pointermove="handlePointerMove"
    @pointerleave="handlePointerLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <div v-if="hasPlayableSource" class="vt-video-player__stage">
      <div
        class="vt-video-player__clip"
        data-vt-ui22r3-inner-clip="1"
        data-vt-ui22r5-surface-toggle="1"
        :data-vt-ui22r5-native-controls="effectiveNativeControls ? '1' : '0'"
        data-vt-ui22r6-control-surface="1"
        role="button"
        tabindex="0"
        :aria-label="surfaceToggleLabel"
        @click="handleSurfaceToggle"
        @keydown.enter.prevent="handleSurfaceToggle"
        @keydown.space.prevent="handleSurfaceToggle"
      >
        <video
          ref="videoRef"
          class="vt-video-player__video"
          :class="'vt-video-player__video--' + props.fit"
          :src="usesSegmentedPlayback ? undefined : props.src || undefined"
          :poster="props.poster || undefined"
          :autoplay="usesSegmentedPlayback ? false : props.autoplay"
          :loop="usesSegmentedPlayback ? false : props.loop"
          :muted="props.muted"
          :playsinline="props.playsInline"
          :preload="usesSegmentedPlayback ? 'none' : props.preload"
          v-bind="nativeVideoControlAttrs"
          @loadedmetadata="handleLoadedMetadata"
          @timeupdate="handleTimeUpdate"
          @play="handlePlay"
          @pause="handlePause"
          @ended="handleEnded"
        >
          <track
            v-for="track in usesSegmentedPlayback ? [] : props.tracks"
            :key="track.src"
            :kind="track.kind"
            :src="track.src"
            :srclang="track.srclang"
            :label="track.label"
            :default="track.default"
          >
        </video>

        <div
          v-if="showCustomControls"
          v-show="controlsVisible"
          class="vt-video-player__custom-controls"
          data-vt-ui22r6-custom-controls-bar="1"
          @click.stop
          @pointerdown.stop
        >
          <button
            type="button"
            class="vt-video-player__control-button"
            :aria-label="isPlaying ? 'Pause video' : 'Play video'"
            @click.stop="handleSurfaceToggle"
          >
            <svg
              v-if="isPlaying"
              class="vt-video-player__control-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect
                x="6.5"
                y="5"
                width="4"
                height="14"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="13.5"
                y="5"
                width="4"
                height="14"
                rx="1.5"
                fill="currentColor"
              />
            </svg>

            <svg
              v-else
              class="vt-video-player__control-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M8 5.75v12.5L18 12 8 5.75Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <span class="vt-video-player__time">
            {{ formattedCurrentTime }} / {{ formattedDuration }}
          </span>

          <input
            class="vt-video-player__progress"
            type="range"
            min="0"
            :max="duration || props.duration || 0"
            step="0.01"
            :value="currentTime"
            :disabled="!(duration || props.duration)"
            :aria-label="'Seek ' + mediaLabel"
            @input="handleSeekInput"
            @click.stop
            @keydown.stop
          >

          <button
            type="button"
            class="vt-video-player__control-button vt-video-player__fullscreen-button"
            :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            @pointerdown.stop
            @click.stop="toggleFullscreen"
          >
            <svg
              v-if="!isFullscreen"
              class="vt-video-player__control-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M5 9V5h4M15 5h4v4M19 15v4h-4M9 19H5v-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <svg
              v-else
              class="vt-video-player__control-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M9 5v4H5M19 9h-4V5M15 19v-4h4M5 15h4v4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="vt-video-player__unsupported">
      Video source is missing.
    </div>

    <p
      v-if="playbackError"
      class="vt-video-player__error"
    >
      {{ playbackError }}
    </p>

    <figcaption v-if="props.title" class="vt-video-player__caption">
      {{ props.title }}
    </figcaption>
  </figure>
</template>

<style scoped>
.vt-video-player {
  --vt-video-ratio: 16 / 9;
  --vt-video-fit: contain;
  --vt-video-inner-inset: 1px;
  --vt-video-inner-radius: 1.5px;
  width: min(100%, var(--vt-video-frame-max-width, 720px));
  margin-inline: auto;
}

.vt-video-player__stage {
  position: relative;
  width: 100%;
  aspect-ratio: var(--vt-video-ratio);
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  contain: layout paint;
  transform: translateZ(0);
}

.vt-video-player__clip {
  position: absolute;
  inset: var(--vt-video-inner-inset);
  overflow: hidden;
  border-radius: var(--vt-video-inner-radius);
  background: transparent;
  isolation: isolate;
  cursor: pointer;
}

.vt-video-player__clip:focus-visible {
  outline: 2px solid color-mix(in srgb, currentColor 35%, transparent);
  outline-offset: 3px;
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
  background: transparent;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.vt-video-player__video--contain {
  object-fit: contain;
}

.vt-video-player__video--cover {
  object-fit: cover;
}

.vt-video-player__custom-controls {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 2;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, #111 62%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.vt-video-player__control-button {
  appearance: none;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, #fff 88%, transparent);
  color: #111;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  cursor: pointer;
  font: inherit;
  line-height: 1;
}

.vt-video-player__control-icon {
  display: block;
  width: 14px;
  height: 14px;
}

.vt-video-player__fullscreen-button {
  flex: 0 0 auto;
}

.vt-video-player__time {
  color: #fff;
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.vt-video-player__progress {
  width: 100%;
  min-width: 0;
  accent-color: #fff;
}

@media (max-width: 720px), (pointer: coarse) {
  .vt-video-player[data-orientation='portrait'] .vt-video-player__custom-controls {
    left: 50%;
    right: auto;
    bottom: 5px;
    box-sizing: border-box;
    width: min(calc(100% - 10px), 146px);
    grid-template-columns: 34px minmax(52px, 58px) 34px;
    justify-content: space-between;
    gap: 5px;
    padding: 4px 5px;
    transform: translateX(-50%);
  }

  .vt-video-player[data-orientation='portrait'] .vt-video-player__time {
    display: none;
  }

  .vt-video-player[data-orientation='portrait'] .vt-video-player__control-button {
    width: 34px;
    height: 34px;
  }

  .vt-video-player[data-orientation='portrait'] .vt-video-player__control-icon {
    width: 12px;
    height: 12px;
  }

  .vt-video-player[data-orientation='portrait'] .vt-video-player__progress {
    width: 100%;
    min-width: 52px;
    max-width: 58px;
  }

  .vt-video-player[data-orientation='portrait'] .vt-video-player__fullscreen-button {
    grid-column: 3;
    touch-action: manipulation;
  }
}

.vt-video-player:fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  margin: 0;
  background: #000;
}

.vt-video-player:fullscreen .vt-video-player__stage {
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
}

.vt-video-player:fullscreen .vt-video-player__clip {
  inset: 0;
  border-radius: 0;
}

.vt-video-player:fullscreen .vt-video-player__video {
  object-fit: contain;
}

.vt-video-player__video:fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  object-fit: contain;
  background: #000;
}

.vt-video-player__caption {
  margin-top: 0.65rem;
  color: inherit;
  font-size: 0.86rem;
}

.vt-video-player__unsupported {
  border: 1px dashed currentColor;
  border-radius: 16px;
  padding: 1rem;
  opacity: 0.7;
}
.vt-video-player__error {
  margin: 0.55rem 0 0;
  color: #b91c1c;
  font-size: 0.78rem;
  line-height: 1.4;
}

</style>

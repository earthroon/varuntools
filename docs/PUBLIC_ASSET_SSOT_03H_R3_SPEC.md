# PUBLIC-ASSET-SSOT-03H-R3

## Vue-owned Video Preview Layout / JS Measured Stage Size / No CSS Aspect-Ratio Reliance / Keyboard Toggle Seal

### Goal

Move video preview layout ownership from CSS aspect-ratio calculation to `VideoPlayer.vue`.

### SSOT

- Intrinsic video width: `HTMLVideoElement.videoWidth`
- Intrinsic video height: `HTMLVideoElement.videoHeight`
- Container width: `frameElement.getBoundingClientRect().width`
- Viewport cap: `window.innerHeight * 0.72`
- Owner: `src/components/markdown/VideoPlayer.vue`

### Implementation

- Add `frameElement`, `stageElement`, `videoElement` refs.
- Add `containerWidth`, `viewportHeight`, `intrinsicWidth`, `intrinsicHeight` state.
- Use `ResizeObserver` on the outer frame, not the stage itself.
- Compute `measuredStageSize` in Vue.
- Return `stageStyle` with pixel `width` and `height`.
- Return `videoStyle` with `width`, `height`, `objectFit`, and `objectPosition`.
- Keep Space key playback toggle scoped to the focused stage/video only.
- Do not add global keydown listeners.

### CSS Role

CSS must only own visual chrome:

- border
- radius
- shadow
- background
- focus ring

CSS must not own video ratio math:

- no `.vt-video-player__stage { aspect-ratio: ... }`
- no `.vt-video-player__stage { width: min(...ratio...) }`
- no `.vt-video-player__video { height: 100% }` in CSS

### Pass Token

`PASS_PUBLIC_ASSET_SSOT_03H_R3_VIDEO_JS_MEASURED_PREVIEW`

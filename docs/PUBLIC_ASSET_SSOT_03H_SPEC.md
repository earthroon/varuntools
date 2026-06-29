# PUBLIC-ASSET-SSOT-03H

## Intrinsic Video Aspect Preview + Space Toggle Playback

### Goal

- Read `HTMLVideoElement.videoWidth` and `videoHeight` after metadata is loaded.
- Expose the intrinsic ratio to the preview stage through `--vt-video-aspect-ratio`.
- Let vertical, square, and horizontal videos sit in their own visual ratio instead of stretching to a 16:9-like wide box.
- Keep `object-fit: contain` so default playback does not crop video.
- Toggle playback with Space only when the player stage or video element has focus.
- Do not add global `window` or `document` keyboard listeners.

### State SSOT

- Intrinsic size: `HTMLVideoElement.videoWidth` / `HTMLVideoElement.videoHeight`.
- Playback state: `HTMLVideoElement.paused`, `ended`, `play()`, `pause()`.
- Component state owner: `src/components/markdown/VideoPlayer.vue`.
- Layout owner: `src/styles/markdown-components.css`.

### Files

- `src/components/markdown/VideoPlayer.vue`
- `src/styles/markdown-components.css`
- `scripts/apply-public-asset-ssot-03h-video-preview.mjs`
- `scripts/smoke-public-asset-ssot-03h-video-intrinsic-aspect-keyboard-toggle.mjs`

### PASS token

`PASS_PUBLIC_ASSET_SSOT_03H_VIDEO_INTRINSIC_ASPECT_KEYBOARD_TOGGLE`

### Non-goals

- Do not crop by default.
- Do not set `object-fit: cover` as default.
- Do not introduce global keyboard shortcuts.
- Do not mutate D1, R2, or Worker state.
- Do not rewrite markdown asset URLs.

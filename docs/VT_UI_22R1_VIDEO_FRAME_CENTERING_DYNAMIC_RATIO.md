# VT-UI-22R1 Video Frame Centering Dynamic Ratio

## Patch ID

VT-UI-22R1

## Title

Video Frame Container Centering / Dynamic Intrinsic Ratio Stage / Optional Cover Fit Mode / No Breakout Drift No Black Pillarbox Default

## SSOT

- Video rendering remains owned by src/components/markdown/VideoPlayer.vue.
- Markdown video directives remain mounted through src/markdown/mountMarkdownComponents.ts.
- No new AdaptiveVideoFrame component is introduced.
- Basic layout ownership belongs to .vt-video-player and .vt-video-player__stage.
- The video element fills the stage and does not own layout size.

## Contract

The player reads the media intrinsic size on loadedmetadata, classifies the media as landscape, portrait, or square, and writes the resulting ratio into --vt-video-ratio. The stage owns aspect-ratio. The video uses absolute fill with object-fit controlled by --vt-video-fit.

## Rules

- Default video-player must not use vt-media-breakout.
- Breakout is allowed only through explicit breakout=true.
- ratio=auto uses videoWidth/videoHeight.
- Explicit ratio values override metadata ratio adoption.
- fit=contain is default.
- fit=cover is opt-in and may crop the video.
- vh/svh are used as size guards, not as the primary frame height authority.

## Verification

Run:

```powershell
npm run smoke:vt-ui-22r1-video-frame-centering-dynamic-ratio
npm run smoke:vt-ui-22-mobile-video-frame-stability
npm run smoke:vt-ui-21-route-scroll-top-policy
npm run build
```

## PASS tokens

- PASS_VT_UI_22R1_VIDEO_FRAME_CONTAINER_CENTERING
- PASS_VT_UI_22R1_DYNAMIC_INTRINSIC_RATIO_STAGE
- PASS_VT_UI_22R1_OPTIONAL_COVER_FIT_MODE
- PASS_VT_UI_22R1_NO_BREAKOUT_DRIFT_NO_BLACK_PILLARBOX_DEFAULT

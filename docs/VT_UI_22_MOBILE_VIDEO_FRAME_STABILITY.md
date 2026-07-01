# VT-UI-22

Mobile Video Frame Stability /  
Wrapper Aspect Ratio Size Authority /  
Small Viewport Height Guard /  
No Scroll Jitter Video Reflow

## Problem

Mobile video frames jitter while scrolling when the video player owns layout height through JS measurement, intrinsic video dimensions, or viewport height.

## SSOT

Video frame size is owned by the wrapper stage.

- size owner: `.vt-video-player__stage`
- media owner: `.vt-video-player__video`
- ratio owner: `--vt-video-ratio`
- fit owner: `--vt-video-fit`

The video element must not decide layout height.

## Contract

- Use CSS `aspect-ratio` on the wrapper.
- Fill the video with `position: absolute; inset: 0`.
- Remove `window.innerHeight` and measured stage height from `VideoPlayer.vue`.
- Keep existing `video` and `video-player` directive behavior.
- Keep playback state events, poster, captions, controls, autoplay/muted/playsinline.

## Verify

```powershell
npm run smoke:vt-ui-22-mobile-video-frame-stability
npm run smoke:vt-ui-21-route-scroll-top-policy
npm run build
```

## PASS tokens

- PASS_VT_UI_22_MOBILE_VIDEO_FRAME_STABILITY
- PASS_VT_UI_22_WRAPPER_ASPECT_RATIO_SIZE_AUTHORITY
- PASS_VT_UI_22_SMALL_VIEWPORT_HEIGHT_GUARD
- PASS_VT_UI_22_NO_SCROLL_JITTER_VIDEO_REFLOW

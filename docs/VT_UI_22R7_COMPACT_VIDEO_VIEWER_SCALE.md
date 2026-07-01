# VT-UI-22R7 Compact Video Viewer Scale

## Patch

VT-UI-22R7

Compact Video Viewer Scale /
Half Size Portrait Frame /
Custom Controls Compact Layout /
No Oversized Playback Viewer

## Intent

R7 is a CSS scale policy patch. It keeps the existing VideoPlayer runtime, native controls no-emit policy, custom controls, manifest prelayout, and inner clip contract. It only reduces the visible video viewer size and makes the custom controls compact enough for the smaller frame.

## Scope

Changed:

- src/styles/markdown-components.css
- package.json

Added:

- scripts/smoke-vt-ui-22r7-compact-video-viewer-scale.mjs
- docs/VT_UI_22R7_COMPACT_VIDEO_VIEWER_SCALE.md

## CSS Contract

Portrait:

- desktop/base: width min 100 percent, clamp 160px, 42vw, 190px
- mobile: width min 100 percent, clamp 160px, 46vw, 190px

Landscape:

- desktop/base: 360px cap
- mobile: 340px cap

Square:

- desktop/base: 260px cap
- mobile: 240px cap

Custom controls:

- compact padding
- compact 24px control button
- mobile time text hidden
- mobile controls use auto 1fr grid

## Non Goals

- No VideoPlayer playback logic change
- No native controls reintroduction
- No ratio or orientation rewrite
- No manifest probe implementation
- No volume/fullscreen/scrubber expansion

## Verify

```powershell
npm run smoke:vt-ui-22r7-compact-video-viewer-scale
npm run smoke:vt-ui-22r6-custom-minimal-video-controls
npm run smoke:vt-ui-22r5-mobile-native-controls-suppression
npm run smoke:vt-ui-22r4-mobile-portrait-desktop-parity
npm run smoke:vt-ui-22r3-video-inner-inset-manifest
npm run smoke:vt-ui-22r2-portrait-video-visual-surface
npm run smoke:vt-ui-22r1-video-frame-centering-dynamic-ratio
npm run smoke:vt-ui-22-mobile-video-frame-stability
npm run smoke:vt-ui-21-route-scroll-top-policy
npm run build
```

# VT-UI-22R5 Mobile Native Controls Suppression

## Patch

VT-UI-22R5 moves video native controls to explicit opt-in only.

## Goals

- Suppress native controls chrome by default on mobile portrait video surfaces.
- Keep the video surface tappable/clickable for play and pause.
- Keep keyboard support with Enter and Space.
- Preserve VT-UI-22R3 inner clip and VT-UI-22R4 mobile portrait width policy.

## Contract

- controls absent means native controls are not rendered.
- controls="true" opts into browser native controls.
- VideoPlayer.vue owns shouldShowNativeControls.
- mountMarkdownComponents.ts defaults controls to false.
- CSS does not hide native controls with browser pseudo-element hacks.

## Verification

```powershell
npm run smoke:vt-ui-22r5-mobile-native-controls-suppression
npm run smoke:vt-ui-22r4-mobile-portrait-desktop-parity
npm run smoke:vt-ui-22r3-video-inner-inset-manifest
npm run smoke:vt-ui-22r2-portrait-video-visual-surface
npm run smoke:vt-ui-22r1-video-frame-centering-dynamic-ratio
npm run smoke:vt-ui-22-mobile-video-frame-stability
npm run smoke:vt-ui-21-route-scroll-top-policy
npm run build
```

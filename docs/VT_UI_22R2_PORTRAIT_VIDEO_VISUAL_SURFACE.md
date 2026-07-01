# VT-UI-22R2 Portrait Video Visual Surface Guard

Patch ID: VT-UI-22R2

## Goal

Keep the VT-UI-22R1 adaptive ratio and orientation engine, but fix the visual surface for portrait videos:

- suppress native controls chrome by default for markdown videos
- keep native controls as explicit opt-in through `controls="true"`
- remove black stage and video backgrounds
- replace black letterbox with a soft surface background
- widen portrait guards from the R1 smoke-oriented narrow rail
- preserve contain as the default fit mode

## Source of Truth

- `src/components/markdown/VideoPlayer.vue` owns media state and controls policy.
- `src/styles/markdown-components.css` owns visual frame surface.
- `src/markdown/mountMarkdownComponents.ts` owns markdown data-attr defaults.

## Verify

```powershell
npm run smoke:vt-ui-22r2-portrait-video-visual-surface
npm run smoke:vt-ui-22r1-video-frame-centering-dynamic-ratio
npm run smoke:vt-ui-22-mobile-video-frame-stability
npm run smoke:vt-ui-21-route-scroll-top-policy
npm run build
```

## Pass markers

```txt
PASS_VT_UI_22R2_PORTRAIT_VIDEO_VISUAL_SURFACE_GUARD
PASS_VT_UI_22R2_NATIVE_CONTROLS_CHROME_SUPPRESSION
PASS_VT_UI_22R2_SOFT_LETTERBOX_BACKGROUND
PASS_VT_UI_22R2_NO_BLACK_SOCK_FRAME
```

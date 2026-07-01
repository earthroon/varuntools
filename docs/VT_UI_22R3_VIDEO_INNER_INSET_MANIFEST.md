# VT-UI-22R3 Video Inner Inset Manifest

## Scope

VT-UI-22R3 keeps the R1 ratio/orientation path and R2 visual surface cleanup, then removes the remaining oversized shell effect by inserting a dedicated inner clip layer.

## State ownership

- Metadata owner: `VideoPlayer.vue`
- Manifest input owner: `mountMarkdownComponents.ts`
- Visual clip owner: `.vt-video-player__clip`
- Layout wrapper owner: `.vt-video-player__stage`

## Rules

```txt
stage:
- layout wrapper only
- owns aspect-ratio
- no visual shell paint
- no border
- no shadow

clip:
- owns 1px inset
- owns 1.5px radius
- owns overflow hidden

video:
- fills clip only
- keeps object-fit variable ownership
```

## Manifest priority

```txt
1. explicit ratio prop
2. manifestWidth / manifestHeight
3. loadedmetadata videoWidth / videoHeight
4. 16 / 9 fallback
```

## Markdown example

```md
:::video-player{src="noanoa-demo.mp4" width="1080" height="1920" duration="6.12" fit="contain"}
:::
```

## Verification

```powershell
npm run smoke:vt-ui-22r3-video-inner-inset-manifest
npm run smoke:vt-ui-22r2-portrait-video-visual-surface
npm run smoke:vt-ui-22r1-video-frame-centering-dynamic-ratio
npm run smoke:vt-ui-22-mobile-video-frame-stability
npm run smoke:vt-ui-21-route-scroll-top-policy
npm run build
```

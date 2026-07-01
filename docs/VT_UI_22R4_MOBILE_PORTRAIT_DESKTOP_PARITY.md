# VT-UI-22R4 Mobile Portrait Desktop Parity

## Goal

VT-UI-22R4 keeps the VT-UI-22R3 inner 1px inset clip and 1.5px micro radius, but relaxes the mobile portrait width guard so portrait video does not collapse into a narrow sock-like frame.

## SSOT

- Ratio and orientation: `src/components/markdown/VideoPlayer.vue`
- Visible clip surface: `.vt-video-player__clip`
- Inset: `--vt-video-inner-inset: 1px`
- Radius: `--vt-video-inner-radius: 1.5px`
- Mobile portrait width: `src/styles/markdown-components.css`

## Policy

- Do not rewrite ratio, orientation, manifest, or clip logic.
- Do not reintroduce stage shell background, border, or shadow.
- Do not use `svh` as the dominant width limiter for mobile portrait video.
- Use container/vw based width so mobile portrait looks closer to desktop.

## CSS contract

```css
.vt-video-player[data-orientation='portrait'],
.vt-video-player--portrait {
  width: min(100%, clamp(320px, 78vw, 360px));
  max-width: 100%;
}

@media (max-width: 720px) {
  .vt-video-player[data-orientation='portrait'],
  .vt-video-player--portrait {
    width: min(100%, clamp(300px, 86vw, 360px));
  }
}
```

## PASS markers

- PASS_VT_UI_22R4_MOBILE_PORTRAIT_DESKTOP_PARITY
- PASS_VT_UI_22R4_PORTRAIT_WIDTH_GUARD_RELAX
- PASS_VT_UI_22R4_NO_NARROW_SOCK_MOBILE_FRAME
- PASS_VT_UI_22R4_KEEP_INNER_INSET_CLIP

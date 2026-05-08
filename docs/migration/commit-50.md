# Commit 50 — Media Breakout Rail / Wide Image Layout

## Purpose

Keep Markdown body text readable while allowing media and homepage card sections to expand into dedicated display rails.

## Layout tokens

```txt
--vt-content-max = text/content rail
--vt-media-max   = captioned image, gallery strip, video player, before-after rail
--vt-home-max    = home/product/work card rail
```

## Contract

- `.vt-markdown` remains bound to `--vt-content-max`.
- `.vt-media-breakout` owns viewport-centered media expansion.
- `.vt-home-section` owns home/card rail expansion.
- `markdown-box` must not use `vt-media-breakout`, `--vt-media-max`, or `--vt-home-max`.
- Mobile resets breakout to content width.

## Files touched

```txt
src/styles/responsive.css
src/styles/markdown-layout.css
src/styles/markdown-components.css
src/components/markdown/CaptionedImage.vue
src/components/markdown/GalleryStrip.vue
src/components/markdown/VideoPlayer.vue
src/components/markdown/BeforeAfterWiper.vue
src/content/pages/lab-markdown-gallery/index.md
scripts/smoke-media-breakout.mjs
```

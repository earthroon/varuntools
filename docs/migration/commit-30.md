# Commit 30 — Media Asset Registry / Native Video Player

## Scope

Commit 30 adds native video playback support for Markdown content. This is not the HLS/R2 streaming layer yet. It is the media entry point for progressive video playback inside VARUNTOOLS pages.

## New directive

```md
::video-player
src: ./videos/qa-video.webm
poster: ./images/qa-video-poster.svg
title: Video Player QA
caption: Native video-player directive sample for progressive playback.
controls: true
preload: auto
::
```

## Rules

- Use `::video-player` for native video playback.
- `::video` remains as a compatibility alias.
- Native browser controls are used by default.
- `autoplay` is only enabled when `muted` is also true.
- HLS/manifest playback is detected but not enabled in this commit.
- Video, poster, and future subtitle assets must pass Asset Registry checks.

## Not in this commit

- HLS adapter
- Theater mode
- Custom controls
- Video card gallery
- R2/media origin integration
- Video before/after comparison

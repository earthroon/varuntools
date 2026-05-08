# Commit 108 — Lazy WebGPU EWA Gallery Processor

`perf(media): add lazy WebGPU EWA gallery processor`

## What changed

- Added `src/media/ewa/ewaWebGpuRuntime.ts`.
- Added `src/media/ewa/ewaGalleryProcessor.ts`.
- Added `src/media/ewa/ewaPresets.ts`.
- Added vendor EWA/WGSL files under `src/media/ewa/vendor/`.
- Added `src/composables/useEwaGalleryProcessor.ts`.
- Wired the processor into `MarkdownLightbox.vue`, where gallery activation actually happens.
- Added EWA lightbox status styling.
- Added `smoke:ewa-gallery-processor` and launch-gate wiring.

## Scope

The processor is lazy and active-image-only:

- no page-load WebGPU initialization,
- no global portfolio image processing,
- no thumbnail batch processing,
- no build-time derivative generation,
- no GPU-only rendering without fallback.

## Runtime behavior

The original image remains visible immediately. If WebGPU processing succeeds, a processed blob URL replaces the displayed lightbox image. If it fails, the original image remains visible.

## Non-goals

- Image compression.
- `srcset` replacement.
- Cloudflare R2 upload.
- Qmap adaptive chain full import.
- Server-side derivative generation.

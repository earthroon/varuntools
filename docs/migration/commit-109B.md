# Commit 109B — Actual WebGPU EWA Gallery Compute Path

`feat(media): wire actual WebGPU EWA gallery compute path`

## What changed

- Added a split WebGPU EWA compute wrapper.
- Added active image ImageBitmap decode and GPUTexture upload.
- Added EWA/aniso compute output into an `rgba16float` texture.
- Added canvas presentation for the computed output texture.
- Kept original-first display, timeout fallback, stale-token guard, and small cache policy from Commit 109A.
- Added `smoke:ewa-webgpu-compute` and wired it into `check:launch`.

## Runtime flow

```txt
MarkdownLightbox active image
→ ewaGalleryProcessor
→ loadImageBitmapForEwa
→ uploadImageBitmapToTexture
→ runEwaAnisoDownscale
→ presentEwaTextureToCanvas
→ processed object URL replaces source only on success
```

## Excluded

- Qmap adaptive chain.
- Tilemask EWA selection.
- Build-time media derivatives.
- WorkCard thumbnail GPU processing.
- Global image processing.
- GPU output file persistence.

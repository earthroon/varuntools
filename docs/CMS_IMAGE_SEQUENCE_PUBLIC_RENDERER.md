# VT-CMS-03 CMS Image Sequence Layout Stability

Patch: VT-CMS-03

Title: Image Sequence Reserved Slot / CLS Stable Frame / Caption Strip Polish / No Image Optimization

Local SSOT path:
D:\11124\dd\varuntools

## Scope

This patch stabilizes the public ImageSequence component layout after VT-CMS-02.

It uses the CMS-provided width and height fields to set a reserved frame ratio. It keeps the published item order intact and does not perform image optimization.

## Changes

- src/components/markdown/ImageSequence.vue
- scripts/smoke-cms-image-sequence-layout-stability.mjs
- package.json script smoke:cms-image-sequence-layout

## Explicit non-goals

- No srcset
- No sizes
- No picture/source pipeline
- No thumbnail generation
- No blur placeholder
- No EWA line
- No WebGPU line
- No D1 lookup
- No R2 list lookup

## Verify

Run from:
D:\11124\dd\varuntools

Commands:

  npm run smoke:cms-image-sequence-directive
  npm run smoke:cms-image-sequence-renderer
  npm run smoke:cms-image-sequence-layout
  npm run typecheck
  npm run build

## Pass token

PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_LAYOUT_STABILITY

# VT-CMS-04 CMS Image Sequence E2E Static Contract

Patch: VT-CMS-04

Title: Published CMS Page Fixture / Image Sequence End To End Render Smoke / Static Route Materialization / No Runtime D1 Coupling

Local SSOT path:
D:\11124\dd\varuntools

## Scope

This patch adds a published CMS sourceBody fixture and two smokes that validate the public image-sequence contract beyond the component layer.

## Changes

- scripts/fixtures/cms-image-sequence-page.md
- scripts/smoke-cms-image-sequence-e2e-render.mjs
- scripts/smoke-cms-image-sequence-static-build.mjs
- package.json scripts:
  - smoke:cms-image-sequence-e2e
  - smoke:cms-image-sequence-static

## Verification flow

Run from:
D:\11124\dd\varuntools

Commands:

  npm run smoke:cms-image-sequence-directive
  npm run smoke:cms-image-sequence-renderer
  npm run smoke:cms-image-sequence-layout
  npm run smoke:cms-image-sequence-e2e
  npm run typecheck
  npm run build
  npm run smoke:cms-image-sequence-static

The static smoke must be run after build. The E2E smoke writes a local readback receipt under node_modules/.cache/varuntools/vt-cms-04, so it should be run before the static smoke.

## Non-goals

- No image optimization.
- No srcset or sizes.
- No picture/source pipeline.
- No EWA or WebGPU processing.
- No D1/R2 direct public runtime coupling.
- No assetId based public re-query.

## Pass tokens

PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_E2E_RENDER
PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_STATIC_BUILD

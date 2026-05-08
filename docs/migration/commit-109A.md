# Commit 109A — Harden EWA gallery state and fallback contract

`refactor(media): harden EWA gallery state and fallback contract`

## What changed

- Added `src/media/ewa/ewaTypes.ts` for shared EWA state, fallback, preset, and token types.
- Converted EWA presets into explicit config objects with WebGPU permission and numeric parameter contracts.
- Added `src/media/ewa/ewaDebug.ts` with opt-in debug/compare hooks.
- Added timeout fallback with `EWA_PROCESS_TIMEOUT_MS`.
- Strengthened active-image stale result protection with structured process tokens.
- Split WebGPU runtime failure states for unsupported, adapter unavailable, device request failure, and device lost.
- Kept the original-first lightbox display contract.
- Strengthened `smoke:ewa-gallery-processor` to verify the new contracts.

## What did not change

- No global image processing.
- No page-load WebGPU initialization.
- No build-time derivative generation.
- No WorkCard thumbnail GPU processing.
- No Qmap adaptive chain expansion.
- No image file output or upload flow.

## SSOT

Original image source remains the SSOT. EWA results are runtime-only, disposable active-lightbox render results.

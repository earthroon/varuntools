# Commit 109D Migration

```txt
feat(media): add adaptive EWA tile path for active gallery image
```

## What changed

- Added `EwaComputeMode` with `basic` and `adaptive-tile`.
- Added adaptive tile parameters to EWA presets.
- Added `vt:ewa-mode` debug hook.
- Added adaptive tile diagnostics and fallback state.
- Added `ewaTileMask.ts` and `ewaAdaptiveTileCompute.ts`.
- Extended the EWA debug panel with compute mode and tile diagnostics.
- Added `smoke:ewa-adaptive-tile`.

## What did not change

- Page-load WebGPU initialization is still forbidden.
- WorkCard and thumbnail GPU processing are still forbidden.
- Qmap adaptive chain is not wired.
- GPU output is still runtime-only and not a content SSOT.

## Manual QA

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-compare', 'split')
localStorage.setItem('vt:ewa-mode', 'adaptive-tile')
```

Then open a gallery image and compare original vs processed output.

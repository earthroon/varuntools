# EWA Visual QA

EWA visual QA is a browser-only diagnostic layer for the lazy WebGPU gallery processor.
It does not change the source image, page CSV, asset manifest, or publish metadata.

## Enable debug

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-compare', 'split')
```

Supported compare values:

- `off`: normal lightbox rendering.
- `original`: force the original image.
- `processed`: prefer the EWA processed output when it exists.
- `split`: show a fixed original/EWA comparison view.

## Diagnostics

The debug panel reports:

- status and preset
- source size and target size
- device pixel ratio
- decode/upload/compute/present/total timings
- fallback reason
- WebGPU capability state
- warnings such as slow compute, target too large, fallback used, or pixel-safe bypass

## Contract

The processor still runs only when a gallery image is active in the lightbox. Debug mode must not initialize WebGPU on page load.
The original image remains the visual fallback. EWA output is an ephemeral runtime observation, not SSOT.

## Adaptive tile diagnostics

When `vt:ewa-mode=adaptive-tile` is set, the QA panel also shows compute mode, adaptive fallback, tile size, q threshold, tile grid, active tile count, and active tile ratio.

The split compare view still compares original vs processed output. The processed output may come from either `basic` or `adaptive-tile`; check the debug panel for the active compute mode.


## Commit 109E presentation policy

The final EWA lightbox presentation is sealed to the `rgba8unorm-sRGB` / 8-bit sRGB SDR family. Compute textures can remain `rgba16float`, but canvas/blob output is treated as runtime presentation, not SSOT. See `docs/authoring/ewa-color-presentation.md`.


## Quality budget diagnostics

When `vt:ewa-debug` is enabled, the EWA QA panel shows device tier, tier reasons, requested/resolved compute mode, target clamp, and timeout budget. Use `localStorage.setItem('vt:ewa-tier', 'low')` to simulate a lower tier.

## Commit 114 fixture QA

Use `/qa/ewa-gallery` and `docs/authoring/ewa-fixture-gallery.md` to verify photo, UI, line-art, pixel-safe, disabled, and budget downgrade scenarios. The fixture page is hidden/noindex and must not be treated as portfolio content.

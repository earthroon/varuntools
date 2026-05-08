# Commit 109E migration

```txt
refactor(media): harden EWA rgba8unorm-sRGB presentation policy
```

## What changed

- Added an explicit EWA presentation policy contract.
- Kept compute output as `rgba16float`.
- Sealed final presentation to the `rgba8unorm-sRGB` / 8-bit sRGB SDR family.
- Switched default blob output to WebP quality `0.92` with PNG fallback.
- Set default alpha mode to `opaque`.
- Added presentation diagnostics to the EWA QA panel.
- Added `smoke:ewa-color-presentation`.

## What did not change

- No new adaptive algorithm.
- No Qmap-aware path.
- No build-time derivative generation.
- No WorkCard or thumbnail GPU processing.
- No asset file export or manifest mutation.

## Reproduce

```bash
npm run smoke:ewa-color-presentation
npm run smoke:ewa-adaptive-tile
npm run smoke:ewa-visual-qa
npm run smoke:ewa-webgpu-compute
npm run smoke:ewa-gallery-processor
```

For browser QA:

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-compare', 'split')
```

Then open a gallery image in the lightbox.

# EWA Adaptive Tile Path

Commit 109D adds an adaptive EWA path for the portfolio lightbox.

## SSOT

The source of truth remains the active gallery item source from `page.csv`, the Markdown lightbox active item, and the EWA preset contract. The tile mask and adaptive output are runtime-only diagnostics/results. They are not written back to content, manifests, or generated assets.

## Activation contract

Adaptive EWA is lazy. It only runs when a user opens a gallery image in the lightbox and the active image is selected. It does not run on page load, thumbnails, WorkCards, or global image lists.

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-mode', 'adaptive-tile')
```

Supported compute modes:

- `basic`: use the existing WebGPU EWA/aniso path.
- `adaptive-tile`: use tile-select adaptive EWA when the preset allows it.
- `auto`: choose from the preset contract. `ui-low-ring` and `line-art` are candidates; `photo` and `auto` prefer basic; `pixel-safe` falls back to the original.

## Fallback chain

```txt
adaptive-tile
→ basic EWA
→ original image
```

An adaptive failure must not blank the lightbox. The original-first contract remains in force.

## Tile diagnostics

The debug panel may show:

- compute mode
- adaptive fallback state
- tile size
- q threshold
- tile grid size
- active tile count
- active tile ratio

These values describe the current runtime attempt only. They are QA information, not content metadata.

## Exclusions

Commit 109D does not wire the full Qmap preprocess chain, `DadumGPUParams`, tile overlay UI, build-time derivatives, WorkCard GPU processing, image export, or R2 upload.


## Commit 109E presentation policy

The final EWA lightbox presentation is sealed to the `rgba8unorm-sRGB` / 8-bit sRGB SDR family. Compute textures can remain `rgba16float`, but canvas/blob output is treated as runtime presentation, not SSOT. See `docs/authoring/ewa-color-presentation.md`.


## Budget downgrade

Adaptive tile mode is budget-aware. Low or unsupported tiers can downgrade adaptive-tile to basic EWA or original fallback. The downgrade is recorded in diagnostics rather than silently changing authoring metadata.

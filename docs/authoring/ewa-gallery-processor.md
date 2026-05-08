# Lazy WebGPU EWA Gallery Processor

Commit 108 adds a runtime-only EWA refinement path for opened gallery images.

## Contract

This is not a global image optimization pipeline.

- Page load does not initialize WebGPU.
- Work cards and gallery thumbnails are not processed globally.
- The processor runs only after a lightbox/gallery image becomes active.
- Only the active image is processed.
- WebGPU output is ephemeral runtime state, not source-of-truth content.

## SSOT

Original source-of-truth remains:

- `page.csv`
- `portfolio-asset-manifest.json`
- the active `CaseGallery` / lightbox item source URL

Runtime output is disposable:

- generated blob URL
- GPU texture
- active-image processing state

Closing the lightbox clears runtime results and revokes object URLs.

## Why this exists

Browser/CSS downscaling can produce ringing, ghosting, and smeared high-contrast details. The EWA path refines only the image the user actually opened, so initial page rendering remains lightweight.

## Flow

```txt
page load
→ no WebGPU init
→ user clicks a gallery item
→ MarkdownLightbox opens
→ active item is measured
→ WebGPU initializes lazily
→ EWA/aniso downscale runs for the active image only
→ processed blob replaces the displayed image if successful
→ fallback keeps the original image if unsupported or failed
```

## Fallback policy

If WebGPU is unavailable or processing fails, the original image remains visible. The user should not see a blank lightbox.

## Presets

Preset definitions live in `src/media/ewa/ewaPresets.ts`.

- `auto`
- `photo`
- `ui-low-ring`
- `line-art`
- `pixel-safe`

`pixel-safe` intentionally falls back instead of using EWA, because pixel/dot assets should not be smoothed by a low-ring photo/UI filter.

## Cache policy

The cache key includes:

- source URL
- target width
- target height
- preset id
- algorithm version

The default cache size is small: active image, previous image, and next image scale only. Commit 108 does not process every gallery item.

## Verification

```bash
npm run smoke:ewa-gallery-processor
```

## Commit 109A hardening notes

Commit 109A does not expand the EWA processor into a global image pipeline. It hardens the runtime contract around the active lightbox image.

### Preset contract

Preset definitions are explicit `EwaPresetConfig` objects. Each preset declares whether WebGPU is allowed and carries numeric parameters for `radiusMul`, `sigma`, `anisoAspect`, `deThresh`, `deSoft`, and `deK`.

`pixel-safe` is a fallback preset. It sets `allowWebGpu: false` and `preferFallback: true`, because pixel/dot images are more likely to be damaged by smoothing than helped by low-ring filtering.

### Original-first display

The lightbox must always show the original image first. The processed result may replace the visible image only after successful completion.

```txt
lightbox open
→ original image visible
→ EWA processing starts
→ processed image replaces original only on success
→ fallback/timeout/unsupported keeps original visible
```

### Timeout and stale result policy

The processor uses `EWA_PROCESS_TIMEOUT_MS` to avoid holding the UI hostage. When processing exceeds the timeout, the result is treated as `processing-timeout` and the original image remains visible.

Active-image transitions are guarded by a structured process token containing source URL, target width, target height, preset, and start time. A late result for an old image must not replace the current active image.

### Debug hooks

Debugging is opt-in. Set local storage to inspect EWA state:

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-compare', 'processed') // original | processed | split
```

The lightbox exposes `data-ewa-status`, `data-ewa-debug`, and `data-ewa-compare` attributes for inspection and non-invasive styling.

### Import contract

Vue components import only the composable/wrapper layer. They must not import files from `src/media/ewa/vendor/` directly.

## Commit 109B actual WebGPU compute path

Commit 109B wires the real WebGPU EWA/aniso compute path into the existing lazy lightbox processor contract.

This still is not a global image pipeline:

- WebGPU is not initialized on page load.
- WorkCard thumbnails are not processed.
- Gallery grid thumbnails are not processed.
- Only the currently active lightbox image is decoded, uploaded, processed, and presented.

### Runtime modules

The compute path is split into wrapper modules so Vue components never import vendor files directly.

- `src/media/ewa/ewaWgslSources.ts` holds the runtime WGSL source strings.
- `src/media/ewa/ewaTextureUpload.ts` decodes the active image and uploads it to a GPU texture.
- `src/media/ewa/ewaWebGpuCompute.ts` runs the EWA/aniso compute pass into an `rgba16float` texture.
- `src/media/ewa/ewaCanvasPresenter.ts` renders the output texture to a WebGPU canvas and creates the display object URL.
- `src/media/ewa/ewaGalleryProcessor.ts` owns orchestration, cache, timeout, fallback, and cleanup.

### Display contract

The original image is visible first. A processed EWA output may replace it only after the active image compute path finishes successfully.

```txt
original image visible
→ decode active image
→ upload ImageBitmap to GPUTexture
→ run EWA/aniso compute
→ render output texture to canvas
→ create blob URL
→ replace visible src only on success
```

### Fallback contract

The original image remains visible when any of the following happens:

- WebGPU is unsupported.
- adapter/device request fails.
- source decoding fails.
- the image is `pixel-safe`.
- the target would be an upscale path.
- the compute or presentation pass times out.
- device is lost.

### Current scope

Commit 109B connects the basic EWA/aniso path. It does not wire the Qmap adaptive chain, tilemask selection, tensor-field anisotropy, build-time derivatives, image export, or CDN upload.


## Commit 109C visual QA

Enable browser diagnostics with `localStorage.setItem('vt:ewa-debug', 'true')`. Set `vt:ewa-compare` to `original`, `processed`, `split`, or `off` to inspect EWA output against the original. Diagnostics are runtime observations only; they do not mutate `page.csv`, generated manifests, or published assets.

## Commit 109D: adaptive tile mode

Commit 109D adds an optional adaptive tile compute mode for active lightbox images.

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-mode', 'adaptive-tile')
```

This mode keeps the original activation rule: the processor only runs after the gallery/lightbox has an active image. It does not run on page load, WorkCards, or thumbnails.

Fallback order:

```txt
adaptive-tile → basic EWA → original image
```

The debug panel reports tile size, q threshold, tile count, active tile count, and active tile ratio. These are runtime diagnostics only and are not source-of-truth content.


## Commit 109E presentation policy

The final EWA lightbox presentation is sealed to the `rgba8unorm-sRGB` / 8-bit sRGB SDR family. Compute textures can remain `rgba16float`, but canvas/blob output is treated as runtime presentation, not SSOT. See `docs/authoring/ewa-color-presentation.md`.

## Commit 110: per-image authoring metadata

Gallery images may now carry per-image EWA hints from `page.csv`:

```txt
media.ewaPreset=ui-low-ring
media.ewaMode=adaptive-tile
media.pixelSafe=true
media.ewaEnabled=false
media.ewaNote="debug note"
```

These hints are carried from the CSV row to the active `MarkdownLightbox` item and are resolved by `resolveEwaPresetFromAuthoring()`. They do not process images on page load, do not mutate source assets, and do not apply to WorkCard thumbnails.


## Device tier and quality budget

Commit 111 adds runtime quality budgets. Authoring metadata remains the source intent, but the active lightbox EWA execution can be clamped or downgraded by device tier. This keeps active-image-only EWA from overrunning weak or unsupported WebGPU environments.

## Commit 113 rollout gate

EWA processing now passes through a rollout gate before runtime health, device tier, and quality budget decisions.

Default mode:

```txt
metadata-only
```

Supported rollout modes:

```txt
off
debug-only
metadata-only
enabled
```

The gate is runtime-only and does not modify `page.csv`, generated manifests, or image assets.

## Commit 114 fixture QA

Use `/qa/ewa-gallery` and `docs/authoring/ewa-fixture-gallery.md` to verify photo, UI, line-art, pixel-safe, disabled, and budget downgrade scenarios. The fixture page is hidden/noindex and must not be treated as portfolio content.

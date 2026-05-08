# EWA rgba8unorm-sRGB presentation policy

Commit 109E seals the EWA lightbox presentation path.

## SSOT

The source of truth remains:

- `MarkdownLightbox` active item
- original image `src`
- EWA preset contract

The WebGPU canvas, blob URL, and diagnostics are runtime presentation results. They are not authoring sources and must not be written back to `page.csv`, asset manifests, or source images.

## Color policy

The EWA compute path may use high precision intermediate textures:

```txt
compute output: rgba16float
```

The final lightbox presentation is sealed to:

```txt
presentation family: rgba8unorm-sRGB
color space: sRGB
bit depth: 8-bit
dynamic range: SDR
```

This keeps the user-facing result in a predictable 8-bit sRGB SDR path while still allowing the EWA kernels to compute in `rgba16float`.

## Canvas format

The policy family is `rgba8unorm-sRGB`, but the concrete WebGPU canvas format may be the browser-preferred 8-bit presentation format such as `rgba8unorm` or `bgra8unorm`.

Do not hardcode an unsupported `rgba8unorm-srgb` canvas literal. The policy is color/presentation intent; the runtime canvas format remains browser-safe.

## Output format

Default output:

```txt
format: webp
quality: 0.92
alpha: opaque
```

If WebP blob creation fails, the presenter may fall back to PNG. If all blob presentation fails, the lightbox keeps the original image.

## Alpha policy

Default alpha mode is `opaque` because portfolio lightbox images are treated as opaque presentation media. Transparent image handling can be expanded later, but 109E keeps the default path stable and avoids premultiplied-alpha halo surprises.

## Diagnostics

The EWA diagnostics panel now reports:

- compute format
- presentation family
- canvas format
- color space / bit depth / dynamic range
- alpha mode
- output format / quality
- blob size / blob time
- object URL creation

Warnings are runtime QA observations, not publish-gate errors.

## Fallback policy

```txt
toBlob success
→ object URL presentation

toBlob WebP failure
→ PNG fallback

all presentation failure
→ original image fallback
```

The lightbox must never show a blank frame while waiting for presentation output.

## Compare view normalization

Original and processed panes use the same fit and neutral background so users do not mistake layout/background differences for color drift.

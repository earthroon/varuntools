# EWA image metadata

EWA image metadata lets a portfolio author choose how a single gallery image should be treated when it is opened in the lightbox.

This is an authoring hint, not a source mutation. The original image remains the SSOT, and the EWA result remains an ephemeral runtime presentation result.

## SSOT

- Source SSOT: `page.csv`
- Runtime target: active `MarkdownLightbox` item only
- Generated GPU/blob output: not SSOT

## Supported CSV options

Use these on `case-gallery-item` rows through the `options` column. The CSV parser preserves nested `media.*` keys into the gallery item metadata.

```csv
case-gallery-item,Admin UI,관리자 화면,./images/admin.png,관리자 UI,캡션,,,,media.ewaPreset=ui-low-ring;media.ewaMode=adaptive-tile,
```

### `media.ewaPreset`

Allowed values:

- `auto`
- `photo`
- `ui-low-ring`
- `line-art`
- `pixel-safe`

Examples:

```txt
media.ewaPreset=ui-low-ring
media.ewaPreset=photo
media.ewaPreset=line-art
media.ewaPreset=pixel-safe
```

### `media.ewaMode`

Allowed values:

- `basic`
- `adaptive-tile`
- `auto`

Examples:

```txt
media.ewaMode=basic
media.ewaMode=adaptive-tile
```

### `media.pixelSafe`

```txt
media.pixelSafe=true
```

When this is true, the image is treated as `pixel-safe` and WebGPU EWA is bypassed. This prevents smoothing pollution on pixel/dot assets.

### `media.ewaEnabled`

```txt
media.ewaEnabled=false
```

When this is false, the EWA processor is bypassed and the original image remains the lightbox output.

### `media.ewaNote`

```txt
media.ewaNote="UI screenshot; keep small text stable"
```

This is an authoring/debug note. It does not change runtime behavior.

## Examples

### UI screenshot

```csv
case-gallery-item,Admin UI,관리자 화면,./images/admin.png,관리자 UI,캡션,,,,media.ewaPreset=ui-low-ring;media.ewaMode=adaptive-tile,
```

### Photo

```csv
case-gallery-item,Photo,작업 사진,./images/photo.jpg,작업 사진,캡션,,,,media.ewaPreset=photo;media.ewaMode=basic,
```

### Line art

```csv
case-gallery-item,Diagram,도식,./images/diagram.png,도식,캡션,,,,media.ewaPreset=line-art;media.ewaMode=adaptive-tile,
```

### Pixel-safe image

```csv
case-gallery-item,Pixel preview,도트 프리뷰,./images/pixel.png,도트 프리뷰,캡션,,,,media.ewaPreset=pixel-safe;media.pixelSafe=true,
```

### Disable EWA

```csv
case-gallery-item,Raw image,원본 유지,./images/raw.png,원본 유지,캡션,,,,media.ewaEnabled=false,
```

## Runtime priority

1. `media.ewaEnabled=false`
2. `media.pixelSafe=true`
3. `media.ewaPreset`
4. `media.ewaMode`
5. automatic resolver based on source/alt/caption/title
6. default `auto`

When debug mode is enabled, `localStorage['vt:ewa-mode']` can override the compute mode for QA. It does not rewrite the authoring metadata.

## Invalid metadata

Invalid values are not silently accepted.

- Invalid preset: `EWA_METADATA_INVALID_PRESET`
- Invalid mode: `EWA_METADATA_INVALID_MODE`
- `pixelSafe=true` overriding a non-pixel preset: `EWA_METADATA_PIXEL_SAFE_OVERRIDES_PRESET`
- `ewaEnabled=false` overriding preset/mode hints: `EWA_METADATA_DISABLED_OVERRIDES_PRESET`

The runtime falls back safely, but the diagnostics keep the warning visible.

## Debug panel

When EWA debug is enabled:

```js
localStorage.setItem('vt:ewa-debug', 'true')
```

The debug panel shows:

- authoring preset
- authoring mode
- authoring source
- pixel-safe state
- EWA enabled state
- authoring note

## Non-goals

This metadata does not:

- process images on page load
- process WorkCard thumbnails
- mutate source assets
- save GPU results to files
- generate build-time derivatives


## Interaction with quality budget

`media.ewaPreset` and `media.ewaMode` are preserved as authoring intent. The runtime quality budget may downgrade execution, for example adaptive-tile to basic on low tier, but it does not rewrite the metadata.

## Rollout interaction

Commit 113 sets the default EWA rollout mode to `metadata-only`. Images with explicit EWA metadata such as `media.ewaPreset`, `media.ewaMode`, or `media.ewaEnabled=true` are allowed through the rollout gate unless blocked by `media.ewaEnabled=false`, `media.pixelSafe=true`, runtime health, device budget, or WebGPU support.

```txt
media.ewaEnabled=false and media.pixelSafe=true always win over rollout enabled.
```

## Commit 114 fixture QA

Use `/qa/ewa-gallery` and `docs/authoring/ewa-fixture-gallery.md` to verify photo, UI, line-art, pixel-safe, disabled, and budget downgrade scenarios. The fixture page is hidden/noindex and must not be treated as portfolio content.

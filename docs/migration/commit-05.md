# Commit 05 — Markdown Media / Asset Hardening

## Purpose

Stabilize how VARUNTOOLS Extended Markdown resolves and renders local media assets referenced from Markdown content.

Commit 05 does not optimize, transform, or upload media. It makes missing and resolved asset states explicit so images, GIFs, WebM videos, MP4 fallbacks, posters, and before/after pairs do not fail silently.

## Scope

- Add typed media asset resolve results.
- Add a development warning registry for missing local media assets.
- Keep the legacy `resolveContentAsset()` string API for backward compatibility.
- Add `resolveContentAssetMeta()` for components that need found/missing state.
- Pass asset state through `mountMarkdownComponents.ts`.
- Add missing-state UI for `VarunVideo`, `BeforeAfterWiper`, and `ImageCard`.
- Add `loading="lazy"`, `decoding="async"`, and `preload="metadata"` where appropriate.

## Files

```txt
src/markdown/mediaAssetTypes.ts
src/markdown/mediaAssetWarnings.ts
src/markdown/resolveContentAssets.ts
src/markdown/mountMarkdownComponents.ts
src/components/markdown/VarunVideo.vue
src/components/markdown/BeforeAfterWiper.vue
src/components/markdown/ImageCard.vue
src/styles/markdown-components.css
docs/migration/commit-05.md
docs/migration/markdown-content-rule.md
```

## MediaAssetResult

```ts
export type MediaAssetKind =
  | 'local'
  | 'external'
  | 'public'
  | 'data'
  | 'empty'
  | 'missing'

export type MediaAssetResult = {
  input: string
  url: string
  kind: MediaAssetKind
  found: boolean
  reason?: string
  contentDir?: string
  resolvedKey?: string
}
```

## Resolve policy

```txt
http:// or https://    -> external, found
//example.com          -> external, found
data:...               -> data, found
/path/from/public      -> public, found
./images/...           -> contentDir-relative local lookup
./media/...            -> contentDir-relative local lookup
empty optional source   -> empty, not found, no console warning
missing local source    -> missing, console.warn in development
```

## Missing asset policy

Missing assets are not silently corrected.

- Video renders a missing shell if both `src` and `fallback` are unavailable.
- Before/After renders a missing shell if either side is unavailable.
- ImageCard keeps the card shell but replaces the image area with a missing thumbnail.
- Development builds log missing local assets through `[VARUNTOOLS][media-asset]`.

## Component behavior

### VarunVideo

- Uses WebM when `srcFound` is true.
- Uses MP4 fallback when `fallbackFound` is true.
- Uses `poster` only when `posterFound` is true.
- Adds `preload="metadata"`.
- Shows missing UI when no playable source exists.

### BeforeAfterWiper

- Requires both `beforeFound` and `afterFound`.
- Adds lazy/async image loading hints.
- Shows missing UI if either side is missing.

### ImageCard

- Adds lazy/async image loading hints.
- Shows a missing thumbnail when `srcFound` is false.
- Keeps caption/tag/href structure intact.

## Out of scope

```txt
- Image optimization pipeline
- GIF to WebM conversion
- WebM to MP4 conversion
- Blur placeholder generation
- Width/height extraction
- CDN/R2 upload
- GitHub Pages workflow
- Legacy Super/Notion parser
- VENOM NAV / Lightbox / Tooltip port
```

## Completion criteria

```txt
- mediaAssetTypes.ts exists
- mediaAssetWarnings.ts exists
- resolveContentAssetMeta() exists
- resolveContentAsset() still returns a string
- mountMarkdownComponents.ts passes asset found/missing state
- VarunVideo handles missing/fallback/poster states
- BeforeAfterWiper blocks invalid partial pairs
- ImageCard shows missing thumbnail
- missing-state CSS exists
- docs updated
```

# VARUNTOOLS-PUBLIC-PLAYBACK-RENDITION-ADMISSION-AND-NO-ORIGINAL-FALLTHROUGH-CLOSURE-R2B

## Scope

Public repository only. VACMS remains the producer of `vacms-public-projection@1` sidecars. Varuntools derives a sanitized runtime asset manifest and never promotes a source video `publicPath` into browser playback authority.

## Authority split

- VACMS sidecar `PublicAssetProjection`: source identity and producer evidence.
- `scripts/build-public-asset-manifest.mjs`: source-to-runtime projection SSOT.
- `cms-207m-public-asset-manifest@2`: browser runtime asset manifest.
- `src/content/usePublicAssetProjection.ts`: video playback admission SSOT.
- `assetRegistry.ts`: semantic `/assets/content/...` to canonical public proxy URL only.
- `mountMarkdownComponents.ts` and `VideoPlayer.vue`: presentation handoff only.

## Producer playback contract

The consumer accepts the existing VACMS 02B producer states:

`ready | missing | stale | unsupported`

A video is browser-playable only when producer state is `ready` and the playback rendition has a distinct rendition identity, a distinct semantic public path, and a positive output size.

## Required seals

- `NO-ORIGINAL-VIDEO-PROJECTION-FALLTHROUGH`
- `NO-ORIGINAL-FULL-BODY-PLAYBACK`
- `NO-RAW-MARKDOWN-FALLBACK-ON-PROJECTED-PAGE`
- `NO-DIRECT-R2-PLAYBACK`
- `NO-SOURCE-PLAYBACK-IDENTITY-COLLISION`
- `NO-SOURCE-PROJECTION-AS-RUNTIME-MANIFEST`
- `NO-MANUAL-SIDECAR-REPAIR`

## Current-sidecar behavior

Existing sidecars without a playback object are intentionally projected as:

```json
{
  "delivery": {
    "class": "none",
    "state": "unavailable",
    "publicPath": null,
    "producerPlaybackState": "missing",
    "reason": "playback_rendition_missing"
  }
}
```

No source video fallback is permitted. Images retain direct semantic delivery through `delivery.class = direct_asset`.

## Frozen surfaces

The bake must preserve these files byte-exact:

- `src/markdown/mountMarkdownComponents.ts`
- `src/components/markdown/VideoPlayer.vue`
- `src/content/assetRegistry.ts`
- `scripts/build-public-content-projection.mjs`
- `src/content/generated/vacms-pages/*.projection.json`

## Promotion gates

- State matrix PASS.
- Runtime manifest build/check PASS.
- CMS-207M-R1 public projection smoke PASS under manifest v2 adoption.
- PUBLIC-ASSET-SSOT-04 smoke suite PASS.
- R2B no-original-fallthrough smoke PASS.
- Frozen file hashes exact.
- Sidecar tree digest exact.
- Generated runtime manifest contains no top-level source video `publicPath`.
- Runtime video `delivery.class` is never `direct_asset`.
- If playback is unavailable, runtime `delivery.publicPath` is null.

## Non-goals

No VACMS mutation, no D1/R2 access, no Worker route mutation, no transcoding, no playback materialization, no VideoPlayer redesign, no markdown mount redesign, and no direct editing of VACMS projection sidecars.

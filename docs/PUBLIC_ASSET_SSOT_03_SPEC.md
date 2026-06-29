# PUBLIC-ASSET-SSOT-03

Video Directive Policy Rebind / Poster Optional Non-Blocking / Autoplay Muted Gate / No Example Poster Authoring Fallback

## Scope

This patch seals the public markdown video directive policy at the directive rendering boundary.

## SSOT

- Video semantic source: markdown directive `src`
- Preferred source path: `/assets/content/page_xxx/asset_xxx/out.webm`
- Delivery resolver: `src/content/assetRegistry.ts`
- Directive policy owner: `src/markdown/directives/videoPlayerDirective.ts`
- Runtime player owner: `src/components/markdown/VideoPlayer.vue`

## Files

- `src/markdown/directives/videoPlayerDirective.ts`
- `src/markdown/mediaAssetTypes.ts` carry-forward guard for `content_asset`
- `scripts/smoke-public-asset-ssot-03-video-directive-policy-rebind.mjs`

## Policy

- `src` or `stream` is required.
- Missing `src` and missing `stream` returns `missing_src_or_stream`.
- `poster` is optional.
- Blank poster is removed.
- `/media/example-poster`, `/media/example-poster.jpg`, and `example-poster.jpg` fallback poster is removed at render time.
- `poster` failure must not block video rendering.
- `autoplay: true` requires `muted: true`.
- If autoplay is requested without muted, autoplay is lowered to `false`.
- The sanitizer must not force `muted` to true.
- `/assets/content/...` remains a semantic source path and must not be rewritten in markdown.

## PASS Token

`PASS_PUBLIC_ASSET_SSOT_03_VIDEO_DIRECTIVE_POLICY_REBIND`

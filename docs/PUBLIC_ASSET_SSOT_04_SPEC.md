# PUBLIC-ASSET-SSOT-04

PROJECTED-ASSET-RUNTIME-PROXY-RESOLUTION /
SEMANTIC-PUBLIC-PATH-PRESERVATION /
PUBLIC-PROJECTION-RESOLVER-ADOPTION /
VIDEO-SOURCE-WORKER-R2-PROXY-CLOSURE /
POSTER-SOURCE-WORKER-R2-PROXY-CLOSURE /
NO-SAME-ORIGIN-STATIC-ASSET-FALLTHROUGH /
NO-DIRECT-R2-PUBLIC-URL

## Authority

- `PublicAssetProjection.publicPath` and `presentation.posterPublicPath` are semantic `/assets/content/...` identities.
- `src/content/assetRegistry.ts` owns runtime delivery URL resolution.
- VACMS Worker owns public byte delivery.
- VACMS D1 owns the asset-to-`r2_key` ledger.
- R2 owns physical bytes.
- The public frontend does not know or publish direct R2 object URLs.

## Required runtime chain

`PublicAssetProjection -> resolveContentAsset -> content_asset_proxy -> VACMS Worker -> D1 r2_key -> R2`

## Invariants

- Generated projection files retain `/assets/content/...` semantic paths.
- Projected video and poster paths are resolved exactly once at the projection-consumer boundary.
- `usePublicAssetProjection.ts` does not duplicate the Worker origin constant.
- `/assets/content/...` must never be handed to the browser as the final projected video URL.
- direct `r2.dev` and `r2.cloudflarestorage.com` URLs are rejected.
- `https://www.varun.tools/assets/content/...` is rejected as static fallthrough.
- no client-side fetch-to-Blob proxy and no full MP4 buffering are introduced.
- poster absence remains non-blocking.

## Non-goals

No VACMS Worker mutation. No D1 migration. No R2 mutation. No public projection schema bump. No content mass rewrite. No MP4 copy into Pages static assets. No direct R2 publication.

## PASS tokens

- `PASS_PUBLIC_ASSET_SSOT_04_PROJECTED_RUNTIME_PROXY_RESOLUTION`
- `PASS_PUBLIC_ASSET_SSOT_04_SEMANTIC_PUBLIC_PATH_PRESERVATION`
- `PASS_PUBLIC_ASSET_SSOT_04_NO_SAME_ORIGIN_STATIC_FALLTHROUGH`

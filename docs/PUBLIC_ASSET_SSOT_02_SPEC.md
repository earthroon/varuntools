# PUBLIC-ASSET-SSOT-02

## Content Asset Proxy Reason Rebind / `/assets/content` Is Not External URL / No Warning For Valid VACMS Asset Path

### Goal

Public `varuntools` must treat `/assets/content/...` as a VACMS content asset semantic path, not as a generic external URL.

### SSOT

- Semantic source: `/assets/content/page_xxx/asset_xxx/file.ext`
- Physical owner: R2 object
- Semantic ledger owner: VACMS D1 `content_assets` and video metadata tables
- Delivery owner: VACMS Worker asset proxy
- Public read adapter: `src/content/assetRegistry.ts`

### Changes

- Extend `AssetKind` with `content_asset`.
- Extend `AssetResolutionReason` with `content_asset_proxy`.
- Change the `/assets/content/...` branch to return:
  - `kind: 'content_asset'`
  - `reason: 'content_asset_proxy'`
  - no `warning: 'external_url'`
- Keep regular `http(s)` URLs as external assets with the existing `external_url` warning.
- Keep markdown source paths as `/assets/content/...`; do not rewrite them to absolute Worker URLs.

### Non-goals

- No D1 read/write.
- No R2 mutation.
- No Worker route/migration change.
- No video metadata hydration.
- No poster auto-binding.
- No HLS/player pipeline.
- No content markdown mass rewrite.

### PASS token

```txt
PASS_PUBLIC_ASSET_SSOT_02_CONTENT_ASSET_PROXY_REASON_REBIND
```

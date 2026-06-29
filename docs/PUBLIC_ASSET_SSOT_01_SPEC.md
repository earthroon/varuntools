# PUBLIC-ASSET-SSOT-01

Public Content Asset Base Rebind / VACMS Worker R2 Delivery Origin Seal / No Ghost Poster No D1 Mutation

## Goal

Bind the public `varuntools` content asset resolver to the currently working VACMS Worker/R2 delivery origin.

This patch only changes the public read adapter fallback base URL for semantic `/assets/content/...` paths.

## SSOT

- Semantic path: `/assets/content/...`
- Public fallback delivery origin: `https://varuntools-admin-api.ragoon703.workers.dev`
- Physical blob owner: R2
- Semantic ledger owner: VACMS D1
- Delivery owner: Worker asset proxy
- Public renderer owner: `src/content/assetRegistry.ts`

## Scope

Modified:

- `src/content/assetRegistry.ts`

Added:

- `scripts/smoke-public-asset-ssot-01-worker-r2-delivery-base-rebind.mjs`
- `docs/PUBLIC_ASSET_SSOT_01_SPEC.md`
- `PUBLIC_ASSET_SSOT_01_APPLY.md`
- `PUBLIC_ASSET_SSOT_01_MANIFEST.json`

## Non-goals

- No D1 migration.
- No R2 mutation.
- No Worker deploy.
- No markdown mass rewrite.
- No video metadata hydration.
- No poster binding implementation.
- No `kind: content_asset` or `reason: content_asset_proxy` rebinding yet. That belongs to PUBLIC-ASSET-SSOT-02.

## Required behavior

`/assets/content/...` must resolve through the configured content asset public base. If no env override is provided, the fallback must be:

```txt
https://varuntools-admin-api.ragoon703.workers.dev
```

Static ghost poster fallback must not be introduced.

## PASS token

```txt
PASS_PUBLIC_ASSET_SSOT_01_WORKER_R2_DELIVERY_BASE_REBIND
```

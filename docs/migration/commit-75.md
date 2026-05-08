# Commit 75 Migration - Product Manifest -> Page Sync / Publish Gate

## Added

- `scripts/product-sync.mjs`
- `scripts/smoke-product-sync.mjs`
- `docs/authoring/product-manifest-page-sync.md`
- `docs/migration/commit-75.md`
- `BAKE_REPORT_COMMIT_75.md`

## Modified

- `package.json`
- `scripts/check-launch.mjs`
- `scripts/lib/csv-markdown.mjs`
- `src/content/templates/product.md`
- `src/content/templates/product.csv`
- `docs/authoring/checkout-handoff.md`
- `docs/authoring/purchase-grants.md`
- `docs/authoring/launch-checklist.md`

## New commands

```bash
npm run product:sync-check
npm run product:sync
npm run smoke:product-sync
```

`product:sync-check` is read-only. It exists to stop manifest/page drift before publish.

`product:sync` is explicit write only. It updates public-safe `index.md` frontmatter from `product.manifest.json`.

## no silent auto-fix

Launch checks do not write files. `check:launch` runs the read-only checker only. This keeps publish validation deterministic and prevents silent content mutation.

## Forbidden public sync fields

The sync script refuses private or runtime-only fields:

- `r2Key`
- `privatePath`
- `internalPath`
- `downloadUrl`
- `publicUrl`
- `grantId`
- `paymentKey`
- `webhookEventId`
- `purchaseOrderId`
- `buyerEmail`

These fields are not public page data. They stay in R2, D1, Worker generated manifests, or payment ledgers.

## Non-goals

- No admin web app.
- No variant or bundle model.
- No webhook grant changes.
- No R2 upload behavior changes.
- No production blocker promotion.
- No image warning burn-down.
- No full page generator.

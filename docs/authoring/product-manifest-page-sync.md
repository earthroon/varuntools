# Product Manifest -> Page Sync

Commit 75 adds the product manifest/page sync gate.

## SSOT boundary

`product.manifest.json` is the inventory, delivery, checkout, and launch contract SSOT. It can know about product readiness, checkout handoff, R2 delivery shape, and publication gates.

`index.md` is the public render document. It can describe the product and expose public-safe frontmatter, but it must not become a private delivery ledger.

The sync gate checks that both files point at the same product. It does not silently fix content during launch checks.

## Commands

```bash
npm run product:sync-check
npm run product:sync
npm run smoke:product-sync
```

`product:sync-check` is the publish gate. It runs in read-only mode and has no silent auto-fix behavior.

`product:sync` is explicit write only. It updates only public-safe frontmatter fields in `index.md` from `product.manifest.json`.

## Checked fields

The checker compares:

- `manifest.slug` against the folder slug.
- Page `slug` against `products/{folderSlug}` or `{folderSlug}`.
- Product slug, SKU, type, and status.
- `checkoutProvider`, `checkoutMode`, `checkoutUrl`, `successUrl`, `failUrl`, and `claimRedirect`.
- `isDemo`, `readyForCatalog`, and `visibility`.
- Public pricing fields such as price, currency, and price visibility.

## Public-safe sync fields

`product:sync` may update:

- `title`
- `visibility`
- `product.slug`
- `product.sku`
- `product.type`
- `product.status`
- `product.checkoutProvider`
- `product.checkoutMode`
- `product.checkoutUrl`
- `product.successUrl`
- `product.failUrl`
- `product.claimRedirect`
- `product.isDemo`
- `product.readyForCatalog`
- `product.price`
- `product.currency`
- `product.priceVisible`

## Forbidden fields

The sync gate must never copy private delivery, grant, payment, or buyer fields into public pages:

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

`downloadUrl` and `publicUrl` remain forbidden as sync targets even when they appear in older product page frontmatter. Private R2 object access belongs to the Worker delivery flow.

## Severity policy

Blockers stop `product:sync-check`:

- missing `product.manifest.json`
- missing `index.md`
- folder slug mismatch
- manifest/page product identity mismatch
- checkout provider or mode mismatch
- visibility or catalog readiness mismatch
- forbidden public fields such as `r2Key` or `privatePath`

Warnings do not stop the gate by default:

- title mismatch
- price display mismatch
- success/fail/claim redirect drift

Use `node scripts/product-sync.mjs --check --strict` to treat warnings as failures.

## Launch relationship

`check:launch` runs `smoke:product-sync` and then `product:sync-check`. It must never run `product:sync` because launch validation is a gate, not a writer.

Commit 75 intentionally avoids full page generation, automatic page rewriting, and production blocker promotion. Production blockers are promoted later.

## Commit 76 admin surface note

Product manifest/page sync remains a storefront publish gate. Admin visibility of sync results belongs to the separate admin app surface and should be wired through the Admin API Worker in Commit 77. The sync checker must not expose private R2 keys, private paths, grants, payment data, or operator-only notes to the public storefront.


## Commit 79 variant / bundle note

Variant and bundle fields (`variantId`, `bundleId`, `licenseScope`, and computed `deliverableCount`) are read-only entitlement metadata. Public pages must never expose `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json`.

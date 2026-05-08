# Commit 79 Migration — Product Variant / Bundle Delivery Expansion

## Added

- `src/types/productEntitlements.ts`
- `src/utils/productEntitlements.ts`
- `src/components/markdown/ProductVariantSelector.vue`
- `src/markdown/directives/productVariantDirective.ts`
- `workers/delivery/src/variantEntitlements.ts`
- `workers/delivery/migrations/0003_variant_bundle_entitlements.sql`
- `workers/admin-api/src/opsEntitlements.ts`
- `scripts/smoke-product-variant-bundle.mjs`
- `docs/authoring/product-variant-bundle.md`
- `docs/ops/variant-bundle-ledger.md`

## Migration

`purchase_grants` gains `variant_id`, `bundle_id`, `entitlement_scope_json`, and `license_scope`. Existing grants remain valid with NULL entitlement fields and continue to use `deliverable_ids_json`.

## Public sync

`product:sync-check` validates manifest variants, deliverableSets, and bundle references. `product:sync` may only write public-safe variant fields. It must not write `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json` into public markdown.

## Non-goals

No cart, coupon, subscription, refund automation, revoke/reissue write action, or license legal finalization is introduced in this commit.

# Commit 53 — Store Policy Pages / Product Trust Blocks

Commit 53 adds the first trust layer around product detail purchase actions.

## Added

- `src/content/pages/policies/**/index.md`
- `src/utils/storePolicies.ts`
- `src/utils/productTrust.ts`
- `src/components/markdown/ProductTrustBlocks.vue`
- `src/markdown/directives/productTrustDirective.ts`
- `scripts/smoke-store-policy-pages.mjs`
- `scripts/smoke-product-trust-blocks.mjs`

## Changed

- Product templates now include `::product-trust` directly after `::product-cta`.
- CSV product template and CSV renderer can emit `product-trust` blocks.
- `validate-content` warns when product detail pages use `::product-cta` without `::product-trust`.
- `check:launch` now includes policy and product trust smoke checks.
- `audit:images` skips hidden pages for representative image warnings so policy pages do not create fake cover requirements.

## Contract

- Policy URLs are owned by `src/utils/storePolicies.ts`.
- Trust block selection is owned by `src/utils/productTrust.ts`.
- Trust UI is owned by `src/components/markdown/ProductTrustBlocks.vue`.

## Legal wording status

Policy pages are scaffolds. Shipping, refund, privacy, and license wording must be reviewed against the actual selling flow before launch.

# Commit 52 — Product Detail CTA / Purchase Flow Contract

## Summary

Commit 52 adds a product-detail CTA contract so product pages can display whether an item is available for purchase, connected to an external store, coming soon, sold out, or missing a purchase link.

## Added

- `src/utils/productAction.ts`
- `src/components/markdown/ProductDetailCta.vue`
- `src/markdown/directives/productCtaDirective.ts`
- `scripts/smoke-product-cta.mjs`

## Changed

- `ProductCard.vue` now uses `resolveProductAction()` instead of local CTA branching.
- `mountMarkdownComponents()` receives the current page and mounts `<product-cta>`.
- `::product-cta` is registered as a markdown directive.
- Product markdown and CSV templates include the product CTA block.
- CSV authoring supports `product-cta` rows.
- `validate-content` warns when product detail pages omit `::product-cta`.
- `check:launch` runs `smoke:product-cta` after `smoke:product-catalog`.

## Non-goals

- No cart.
- No order database.
- No Toss Payments API integration.
- No R2 signed URL/download entitlement logic.
- No fake product seed or fake checkout URL.

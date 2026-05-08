# Commit 54 — CSV Store Metadata v2

## Summary

Commit 54 extends the CSV authoring pipeline so product pages can preserve store metadata through `page.csv` generation.

This commit does not implement cart, order storage, Toss API integration, R2 download authorization, or legal policy wording.

## Added

- `scripts/smoke-csv-store-metadata.mjs`
- `docs/migration/commit-54.md`
- `src/content/pages/products/dummy-catalog/page.csv`
- `src/content/pages/products/dummy-catalog/index.md`
- `src/content/pages/products/dummy-catalog/images/cover.svg`

## CSV product fields

`product` rows now preserve these additional string metadata fields:

```txt
license
series
collection
material
size
releaseDate
shippingNote
refundNote
digitalDeliveryNote
policyNote
inquiryUrl
externalUrl
```

## Status contract

Do not use `published`.

```txt
page.status    = draft / active / archived
product.status = draft / coming-soon / available / sold-out / hidden
```

## Service inquiry pattern

Quote-based services can be represented without fake checkout links.

```csv
product,Brand System Review,상담형 서비스 상품입니다.,./images/cover.webp,,,./images/thumbnail.webp,,,type=service; sku=VT-SERVICE-001; price=; currency=KRW; priceVisible=false; status=available; checkoutProvider=manual; checkoutUrl=; externalStoreUrl=; inquiryUrl=https://example.com/contact; shippingRequired=false; policyNote=문의 후 범위와 견적을 확정합니다.,
```

## Dummy catalog page

The dummy catalog page is intentionally visible in the product catalog as an editing scaffold, not a live sale.

```txt
src/content/pages/products/dummy-catalog/page.csv
```

It uses `product.status: coming-soon`, no checkout URL, and explicit dummy copy so later edits can replace the structure safely.

## Validate

```bash
npm run smoke:csv-authoring
npm run smoke:csv-store-metadata
npm run smoke:product-catalog
npm run smoke:product-cta
npm run smoke:product-trust
npm run validate:content
npm run typecheck
node node_modules/vite/bin/vite.js build
```

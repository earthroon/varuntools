# Commit 67 — Product Upload SSOT / Product Package Intake

Commit 67 adds the product package intake SSOT for real store products.

## Added

```txt
src/config/productUpload.ts
scripts/audit-product-upload.mjs
scripts/smoke-product-upload.mjs
docs/authoring/product-upload.md
docs/authoring/cloudflare-product-delivery.md
```

Demo products now include `product.manifest.json`:

```txt
src/content/pages/products/dummy-catalog/product.manifest.json
src/content/pages/products/spec-playground/product.manifest.json
```

## Delivery decision

Digital delivery is defined as:

```txt
mode: post-purchase
provider: cloudflare-r2
access: private
workerIntegration: future
```

This commit does not expose public download URLs and does not implement the Worker. It only defines the upload/intake contract and validates the manifest shape.

## Commands

```bash
npm run audit:product-upload
npm run smoke:product-upload
```

These are wired into `check:launch` before launch readiness checks.

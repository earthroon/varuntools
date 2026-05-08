# Cloudflare R2 Delivery Worker

Commit 68 adds the delivery Worker contract for post-purchase digital product delivery.

## Boundary

The static VARUN Tools site must not know private paid-file URLs. Product packages declare delivery metadata in:

```txt
src/content/pages/products/{slug}/product.manifest.json
```

The Worker consumes a generated, Worker-only manifest:

```txt
workers/delivery/src/generated/product-delivery-manifest.json
```

Do not copy this generated manifest into `public/`.

## R2 Binding

The Worker expects this R2 binding:

```txt
VARUNTOOLS_PRODUCT_BUCKET
```

It is declared in:

```txt
workers/delivery/wrangler.toml
```

Before deployment, replace the placeholder `bucket_name` with the real Cloudflare R2 bucket name.

## Delivery Mode

Digital product delivery is post-purchase only.

```txt
delivery.mode = post-purchase
delivery.provider = cloudflare-r2
delivery.access = private
```

The Worker must never expose `publicUrl`, `downloadUrl`, or static paid-file links.

## Routes

```txt
GET  /health
GET  /products/:slug/delivery
POST /claims
GET  /download/:grantId/:deliverableId
```

Commit 68 intentionally blocks real downloads with:

```txt
GRANT_VALIDATION_NOT_CONFIGURED
```

Purchase grant creation and payment webhook verification belong to a later commit.

## Required Commands

```bash
npm run generate:delivery-manifest
npm run smoke:delivery-worker
```

## Non-goals

- Toss Payments webhook verification
- D1/KV grant persistence
- Signed URL generation
- Email delivery
- Actual R2 upload tooling

## Commit 72 private grant redemption

`GET /download/:grantId/:deliverableId` now performs D1 purchase grant validation before reading private R2 objects. The Worker increments `download_count` only after the private R2 object is found.

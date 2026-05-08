# Product Upload SSOT

Commit 67 adds the product package intake contract for real store products.

The upload/intake SSOT for one product is:

```txt
src/content/pages/products/{slug}/product.manifest.json
```

The page files around it have different responsibilities:

```txt
product.manifest.json  = upload, asset, delivery, launch readiness SSOT
index.md               = public rendering document
page.csv               = authoring bridge, optional
images/                = product visual assets
files/                 = local notes/placeholders only, not public paid delivery
```

## Package shape

```txt
src/content/pages/products/{slug}/
  product.manifest.json
  index.md
  page.csv
  images/
    cover.webp
    thumbnail.webp
    og.webp
    gallery-01.webp
  files/
    README.md
```

## Post-purchase delivery

Digital products are planned as purchase-gated Cloudflare R2 delivery.

```json
{
  "delivery": {
    "mode": "post-purchase",
    "provider": "cloudflare-r2",
    "access": "private",
    "workerIntegration": "future",
    "r2": {
      "bucketBinding": "VARUNTOOLS_PRODUCT_BUCKET",
      "keyPrefix": "products/example-slug/"
    },
    "deliverables": [
      {
        "id": "main-package",
        "label": "Main product package",
        "type": "zip",
        "format": "zip",
        "r2Key": "products/example-slug/main-package.zip"
      }
    ]
  }
}
```

Do not expose paid files through static `downloadUrl`, public file links, or public R2 URLs. The static site can describe the product, but the future Cloudflare Worker should issue access only after purchase confirmation.

## Demo products

Current demo packages:

```txt
/products/dummy-catalog
/products/spec-playground
```

Both must include:

```json
{
  "isDemo": true,
  "delivery": {
    "mode": "post-purchase",
    "provider": "cloudflare-r2",
    "access": "private",
    "deliverables": []
  },
  "launch": {
    "readyForCatalog": false,
    "readyForCheckout": false
  }
}
```

Demo products prove the workflow but do not ship real files.

## Commands

```bash
npm run audit:product-upload
npm run smoke:product-upload
```

`audit:product-upload` checks manifest validity, slug/folder agreement, SKU uniqueness, required visual assets, private Cloudflare delivery shape, and launch readiness flags.

## Launch readiness split

```txt
product.status                  = customer-facing sale state
launch.readyForCatalog          = operator readiness for catalog exposure
launch.readyForCheckout         = operator readiness for purchase flow
```

A product can be `coming-soon` without being catalog-ready. A product can be `available` only when checkout and delivery contracts are ready.

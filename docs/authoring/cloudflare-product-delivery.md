# Cloudflare Product Delivery

VARUN Tools digital products use a post-purchase delivery model.

## Current contract

```txt
Static site:
- renders product content
- renders CTA/spec/trust blocks
- stores product upload metadata in product.manifest.json
- does not expose paid file URLs

Future Cloudflare Worker:
- receives purchase confirmation or checkout callback
- validates the purchase/session
- grants temporary access to Cloudflare R2 objects
```

## Manifest fields

```json
{
  "delivery": {
    "mode": "post-purchase",
    "provider": "cloudflare-r2",
    "access": "private",
    "workerIntegration": "future",
    "r2": {
      "bucketBinding": "VARUNTOOLS_PRODUCT_BUCKET",
      "keyPrefix": "products/{slug}/"
    },
    "deliverables": [
      {
        "id": "main-package",
        "label": "Main package",
        "type": "zip",
        "format": "zip",
        "r2Key": "products/{slug}/main-package.zip"
      }
    ]
  }
}
```

## Forbidden in Commit 67

```txt
- public downloadUrl for paid products
- publicUrl in product.manifest.json delivery fields
- raw R2 public object URLs
- local static files used as paid download delivery
- password/gateCode-based delivery
```

`gateCode` from the inquiry form is unrelated to delivery authorization.

## Future Worker boundary

Commit 67 does not implement the Worker. The Worker should be introduced in a later commit with its own SSOT for purchase verification, signed access, expiry, logging, and failure states.

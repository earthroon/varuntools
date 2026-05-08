
# R2 Product Upload Flow

Paid product files must not be stored in `public/` or linked from Markdown.

## SSOT

```txt
src/content/pages/products/{slug}/product.manifest.json
```

## Local staging

```txt
_private/product-files/{slug}/
```

This directory is gitignored. Stage files locally before upload.

## Commands

```bash
npm run r2:plan
npm run r2:publish:dry-run
npm run r2:publish
npm run r2:seal
npm run r2:verify
npm run generate:delivery-manifest
```

`r2:publish` uploads files and never edits `product.manifest.json`.

`r2:seal` is the only command that writes deliverable metadata back into `product.manifest.json`.

## Required environment for real upload

```bash
export VARUNTOOLS_R2_BUCKET="your-r2-bucket-name"
```

Dry-run does not require the bucket environment variable.

# Commit 51 — Image Optimization / Asset Naming Guard

Commit 51 adds warning-first image asset auditing for VARUNTOOLS.

## Added

```txt
scripts/audit-images.mjs
scripts/smoke-image-assets.mjs
docs/authoring/image-assets.md
BAKE_REPORT_COMMIT_51.md
```

## Commands

```bash
npm run audit:images
npm run smoke:image-assets
```

## Launch wiring

`check:launch` now runs image checks after asset path checks:

```txt
audit:assets
smoke:assets
audit:images
smoke:image-assets
```

`audit:content` also includes `audit:images`.

## Policy

The image audit reports warnings for filenames, size thresholds, missing representative images, missing gallery thumbnails, and non-webp raster images.

Warnings do not fail the build by default. Use strict mode manually when the image catalog is stable:

```bash
node scripts/audit-images.mjs --strict
```

## Non-goals

This commit does not perform automatic compression, webp conversion, responsive srcset generation, CDN upload, R2 integration, or product CTA work.

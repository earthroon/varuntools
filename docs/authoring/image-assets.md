# Image Assets Authoring

Commit 51 adds the image asset guard for VARUNTOOLS.

This document is the authoring SSOT for image filenames, representative images, thumbnail policy, and pre-launch warning rules.

## Commands

```bash
npm run audit:images
npm run smoke:image-assets
```

`audit:images` is warning-first. It reports launch quality risks, but it does not resize, compress, or rewrite files.

`audit:assets` and `audit:images` are intentionally separate.

```txt
audit:assets = referenced asset paths exist
audit:images = image asset operating quality
```

## Naming rule

Use lowercase kebab-case.

```txt
cover.webp
thumbnail.webp
product-main.webp
detail-01.webp
package-01.webp
texture-closeup.webp
```

Avoid filenames like these:

```txt
IMG_0001.jpg
KakaoTalk_20260505.png
final-final-final.webp
Product Main (1).png
대표이미지.png
```

The audit warns on:

```txt
- spaces
- uppercase letters
- parentheses
- non-ASCII filenames
- non-kebab-case names
- final-final revision chains
```

## Preferred formats

Recommended launch format:

```txt
webp for raster images
svg for lightweight vector fixtures or icons
avif is allowed when manually prepared
```

Allowed but warned:

```txt
png
jpg / jpeg
gif
```

These formats are not blocked because source material may still be in progress before launch.

## Page-local assets

Each content page owns its own assets.

```txt
src/content/pages/{category}/{slug}/
  index.md
  images/
    cover.webp
    thumbnail.webp
    detail-01.webp
  videos/
    demo.webm
```

Use `public/` only for site-wide assets such as OG defaults, robots files, icons, or files that must be served from a root URL.

## Representative images

Recommended page fields:

```yaml
cover: "./images/cover.webp"
thumbnail: "./images/thumbnail.webp"
ogImage: "/og/default-og.svg"
```

`cover` is for detail hero/card surfaces.  
`thumbnail` is for listing, small cards, trays, and compact previews.  
`ogImage` is for social preview metadata.

## Product images

Do not create fake public product images. Product image data belongs to real operational product content.

Recommended product folder shape:

```txt
src/content/pages/products/product-slug/
  index.md
  images/
    cover.webp
    thumbnail.webp
    detail-01.webp
    detail-02.webp
    package-01.webp
```

Product detail pages should have at least one representative image through page frontmatter or product image metadata.

```yaml
cover: "./images/cover.webp"
thumbnail: "./images/thumbnail.webp"
product:
  type: physical
  status: coming-soon
```

## Gallery thumbnails

`gallery-strip` supports an optional third pipe column for a thumbnail.

```md
::gallery-strip
title: Product Details
layout: strip
::
- ./images/detail-01.webp | Front view | ./images/detail-01-thumb.webp
- ./images/detail-02.webp | Detail view | ./images/detail-02-thumb.webp
::
```

Missing gallery thumbs are warnings, not errors. During early authoring, the original image can be reused as the thumbnail. Before launch, add a smaller thumbnail when the gallery becomes heavy.

## Size warning thresholds

Initial warning thresholds:

```txt
cover / hero image: 1.2MB
inline image: 900KB
gallery image: 1.5MB
thumbnail: 300KB
video poster: 700KB
```

The audit uses the strictest threshold when the same file is used in multiple roles. For example, a file used as both `cover` and `thumbnail` is checked against the thumbnail threshold.

## Warning policy

Commit 51 does not fail the build on warnings.

Use this mode for launch pressure:

```bash
node scripts/audit-images.mjs --strict
```

Strict mode exits non-zero if any image warnings exist. Do not enable strict mode by default until the real product catalog and image set are stable.

# Content Structure

A page owns its local assets.

```txt
src/content/pages/{category}/{slug}/
  index.md
  images/
  videos/
  README.md
```

Categories: `works`, `lab`, `tools`, `products`.

Create a page:

```bash
npm run new:page -- works project-name
npm run new:page -- lab experiment-name
npm run new:page -- tools tool-name
```

Use page-local `images/` and `videos/` for page assets. Use `public/` only for site-wide assets.

## CSV-authored pages

CSV-authored pages keep the human-edited source in `page.csv` and generate `index.md`.

```txt
src/content/pages/works/project-name/
  page.csv      # authoring source
  index.md      # generated output
  images/
  videos/
  README.md
```

Create one with:

```bash
npm run new:page -- works project-name --csv
```


## Products

Products use the same page-local asset rule.

```bash
npm run new:page -- products product-slug --csv
```

Product pages live under `src/content/pages/products/{slug}/` and keep images in `images/`, videos in `videos/`.


## Seed work and empty sections

Commit 50-0 adds a minimal work seed at:

```txt
src/content/pages/works/varuntools-showroom/
```

This seed keeps the Featured Works section populated without inventing a public product. Product seed pages should only be created when the product name, SKU, price policy, and availability are real operational data.

Homepage sections can declare empty behavior in Markdown:

```md
::home-section
title: Product Catalog
source: products
emptyMode: notice
emptyTitle: 상품 등록 전입니다
emptyBody: 첫 상품이 등록되면 이곳에서 가격, 상태, 구매 링크를 확인할 수 있습니다.
::
```

Use `emptyMode: hide` when an empty section should not occupy layout space.

## Image asset guard

Commit 51 adds image operating quality checks.

```bash
npm run audit:images
npm run smoke:image-assets
```

Keep page assets local to the page folder and use lowercase kebab-case filenames. See `docs/authoring/image-assets.md` for cover, thumbnail, gallery thumb, public asset, and size warning rules.

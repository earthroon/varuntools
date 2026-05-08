# Page Frontmatter

Recommended fields:

```yaml
title: Project Title
description: Short page summary.
thumbnail: ./images/cover.webp
cover: ./images/cover.webp
tags:
  - work
order: 10
gallery:
  autoMini: true
```

Fields: `title`, `description`, `thumbnail`, `cover`, `ogImage`, `tags`, `order`, `draft`, `noindex`, `gallery.autoMini`.

Do not invent metadata inside components. Page metadata starts in frontmatter.


## Product frontmatter

Product pages add a `product` object. Prices are public by default, checkout links use Toss Payments, and digital delivery URLs are reserved for Cloudflare.

```yaml
product:
  type: physical
  status: coming-soon
  sku: VT-PRODUCT-001
  price: 12000
  currency: KRW
  priceVisible: true
  checkoutProvider: toss-payments
  checkoutUrl: ""
  downloadProvider: cloudflare
  downloadUrl: ""
  showWhenUnavailable: true
```


## Homepage Index

Commit 49 adds homepage sections that collect page metadata from frontmatter instead of duplicating card data manually.

- `featured: true` marks pages for featured sections.
- `order` controls card ordering.
- Product cards read `product.status`, `product.price`, `product.currency`, `product.checkoutUrl`, and `product.externalStoreUrl`.
- `coming-soon` and `sold-out` products may remain visible when `product.showWhenUnavailable: true`.

Homepage sections use:

```md
::home-section
title: Featured Products
source: products
featured: true
limit: 6
layout: product-grid
showUnavailable: true
::
```

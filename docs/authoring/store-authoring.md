# Store Authoring

## Rule

Commit 48 adds a store-ready catalog model. It does not implement cart, order storage, or checkout logic.

Product pages live under:

```txt
src/content/pages/products/{slug}/
```

## Create a product page

```bash
npm run new:page -- products product-slug --csv
```

## Product frontmatter

```yaml
product:
  type: physical
  status: coming-soon
  sku: VT-PRODUCT-001
  price: 12000
  currency: KRW
  priceVisible: true
  stock: unknown
  checkoutProvider: toss-payments
  checkoutUrl: ""
  externalStoreUrl: ""
  downloadProvider: cloudflare
  downloadUrl: ""
  shippingRequired: true
  showWhenUnavailable: true
```

## Checkout

`product.checkoutUrl` is reserved for a Toss Payments payment link.

```yaml
checkoutProvider: toss-payments
checkoutUrl: "https://..."
```

## Digital delivery

Digital product downloads will be connected through Cloudflare later.

```yaml
downloadProvider: cloudflare
downloadUrl: ""
```

## Price visibility

Product prices are public by default.

```yaml
priceVisible: true
```

## Status

- `draft`: authoring only
- `coming-soon`: visible as preparing
- `available`: purchasable when a checkout URL exists
- `sold-out`: visible as sold out
- `hidden`: do not list

`coming-soon` and `sold-out` products may still appear on the homepage or product list when `showWhenUnavailable: true`.


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


## Product seed policy

Do not create public product seed pages with invented product data.

Product pages are operational content. The following fields should come from a real planned item:

```txt
product name
SKU
price / priceVisible
product.status
checkoutUrl / externalStoreUrl
downloadUrl
shippingRequired
```

Before real products exist, product catalog sections should use `emptyMode: notice` with user-facing copy rather than fake product cards.

```md
::home-section
title: Product Catalog
source: products
layout: product-grid
showUnavailable: true
emptyMode: notice
emptyTitle: 상품 등록 전입니다
emptyBody: 첫 상품이 등록되면 이곳에서 가격, 상태, 구매 링크를 확인할 수 있습니다.
::
```

## Product image policy

Product images are operational store content. Do not create fake product images, fake SKUs, or fake prices just to fill the catalog.

Recommended product image shape:

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

Recommended frontmatter:

```yaml
cover: "./images/cover.webp"
thumbnail: "./images/thumbnail.webp"
ogImage: "/og/default-og.svg"
```

Before launch, run:

```bash
npm run audit:images
npm run smoke:image-assets
```

Warnings are allowed during early authoring. They are a launch-quality signal, not fake data permission.

## Product detail CTA

상품 상세 페이지는 `product` frontmatter를 설명으로만 두지 않고, 본문 안에 구매 상태를 드러내는 CTA를 배치한다.

```md
::product-cta
::
```

운영 규칙:

- `available` 상품은 `checkoutUrl` 또는 `externalStoreUrl` 중 하나를 가져야 한다.
- `available`인데 링크가 없으면 버튼은 `구매 링크 준비 중` 비활성 상태로 표시된다.
- `coming-soon`과 `sold-out`은 disabled CTA로 표시된다.
- `priceVisible: false`이면 가격은 표시하지 않는다.
- 실제 결제 링크가 없을 때 fake `checkoutUrl`을 만들지 않는다.
- 외부 결제/스토어 링크는 새 탭으로 열리고 `noopener noreferrer`를 사용한다.

CTA 판단은 `src/utils/productAction.ts`가 SSOT이며, 카드와 상세 CTA가 같은 resolver를 사용한다.


## Store policy pages

Commit 53 adds hidden, route-accessible policy pages under `/policies`.

- `/policies/store`
- `/policies/shipping`
- `/policies/refund`
- `/policies/privacy`
- `/policies/digital-download`

These pages use `status: active`, `visibility: hidden`, and `robots: noindex,follow` until the final legal and operational wording is reviewed. They are meant to support product detail trust blocks without leaking into homepage or work collections.

## Product trust blocks

Product detail pages should place the trust block directly after the product CTA.

```md
::product-cta
::

::product-trust
::
```

`::product-trust` reads `product` frontmatter and shows policy links based on the product type.

- `physical` + `shippingRequired !== false` shows shipping guidance.
- `digital` shows digital download guidance.
- `checkoutUrl` or `externalStoreUrl` shows privacy/external-flow guidance.
- refund and store guidance are shown by default.

Do not invent legal promises inside product content. Shipping, refund, privacy, and license terms must be reviewed against the real selling flow before launch.

## CSV Store Metadata v2

상품 작성은 `src/content/pages/products/{slug}/page.csv`에서 시작할 수 있다. `index.md`는 생성 결과이므로 CSV 기반 페이지에서는 직접 수정하지 않는다.

```bash
npm run csv:page -- src/content/pages/products/product-slug/page.csv
npm run smoke:csv-store-metadata
```

Store metadata v2에서 product block은 다음 운영 필드를 보존한다.

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

운영 규칙:

- `published` 상태값은 쓰지 않는다. 페이지는 `status=active`, 상품은 `status=coming-soon` 또는 `status=available`처럼 분리한다.
- 실제 결제 링크가 없으면 fake `checkoutUrl`을 만들지 않는다.
- 문의형 서비스는 `priceVisible=false`와 `inquiryUrl`을 함께 쓸 수 있다.
- 디지털 상품이 `coming-soon`이면 `downloadUrl`은 비워둘 수 있다.
- 실물 상품은 `material`, `size`, `shippingNote`, `refundNote`를 상품별로 덮어쓸 수 있다.
- `policyNote`는 법률 문구가 아니라 상품 상세의 운영 안내 메모다.

작성용 더미 카탈로그 페이지:

```txt
src/content/pages/products/dummy-catalog/page.csv
src/content/pages/products/dummy-catalog/index.md
```

이 페이지는 실제 판매 상품이 아니라, 나중에 제목/설명/가격/정책/이미지/CTA를 첨삭하기 위한 편집용 견본이다. `status: coming-soon`, 빈 구매 링크, 명시적인 더미 문구로 스토어 SSOT 오염을 막는다.

## Commit 55 — Product catalog filters

`products/index.md` uses `::product-catalog` instead of `::home-section`.

```md
::product-catalog
title: Product Catalog
limit: 48
showUnavailable: true
defaultSort: order
::
```

The catalog can filter by:

```txt
query
product.status
product.type
tags
sort mode
```

`coming-soon` and `sold-out` products may appear on the products page when `showUnavailable: true` is set. Draft and hidden products are never exposed in the public catalog.

The dummy catalog page is an authoring scaffold. Replace it with real product data before launch, or mark it hidden if it should not remain public.

## Store taxonomy fields

Commit 63 separates store taxonomy from free-form tags: `product.type`, `product.category`, `product.subcategory`, `product.collection`, and `product.series`.

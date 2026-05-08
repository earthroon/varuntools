# Store Taxonomy Authoring

Commit 63 adds a dedicated store taxonomy layer so product shelves do not collapse into a loose `tags` pile.

```txt
product.type        = 제공 방식
product.category    = 스토어 매대 위치
product.subcategory = 세부 매대
product.collection  = 브랜드/기획 묶음
product.series      = 연작/세트
tags                = 자유 검색 보조어
```

Use `tags` for search helpers only. Do not replace `category`, `collection`, or `type` with tags.

## Initial values

```txt
type: physical, digital, service, bundle, external
category: stickers, prints, templates, presets, tools, assets, services, bundles
subcategory: notion, writing, color, print, web, ui-kit, texture, workflow
collection: varun-tools, dreamcolor, earthroon, dadumdadum, delta-k
```

## CSV example

```csv
product,Dummy Catalog,카테고리 테스트용 더미 상품입니다.,./images/cover.svg,,,./images/cover.svg,,,type=digital; status=coming-soon; category=templates; subcategory=workflow; collection=varun-tools; series=store-starter; priceVisible=false; inquiryUrl=/inquiry,
```

## Validation policy

```txt
product.status=published = error
unknown type/category/subcategory/collection = warning
non-kebab taxonomy value = warning
missing product.category on product pages = warning
```

## Category landing pages

Commit 64 exposes taxonomy categories as static content pages. Do not publish empty category landing pages in bulk; create them when there is at least one product or an explicit editorial reason.

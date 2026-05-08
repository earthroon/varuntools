# Store Navigation Rail Authoring

Commit 64 기준 스토어 네비게이션은 `::store-nav` directive로 배치한다.

## 원칙

```txt
ProductCatalog = 상품 목록 필터/정렬/검색
StoreNavigationRail = 전체 상품 / 카테고리 / 컬렉션 진입 링크
```

네비게이션 rail은 상품 카탈로그를 대체하지 않는다. 사용자가 어떤 매대로 들어갈지 선택할 수 있게 만드는 안내판이다.

## 기본 사용

```md
::store-nav
title: Store Categories
intro: 상품을 매대별로 둘러봅니다.
mode: categories
showCounts: true
showEmpty: true
includeAllLink: true
::
```

## 카테고리 랜딩에서 현재 항목 표시

```md
::store-nav
title: Store Categories
mode: categories
currentCategory: templates
showCounts: true
showEmpty: true
includeAllLink: true
::
```

`currentCategory`는 taxonomy id를 사용한다. 라벨이 아니라 `templates`, `stickers` 같은 id를 넣는다.

## 빈 카테고리 정책

```txt
showEmpty: false = 상품 count가 0인 카테고리를 숨김
showEmpty: true  = 상품 count가 0인 카테고리를 준비 중 항목으로 표시
```

빈 카테고리 페이지를 대량으로 public 생성하지 않는다. taxonomy에 있는 값은 매대 후보이고, content page로 만든 값만 실제 진입 가능한 매대다.

## 새 카테고리 랜딩 추가 순서

1. `src/config/storeTaxonomy.ts`에 category가 있는지 확인한다.
2. 실제 상품에 `product.category`를 지정한다.
3. `src/content/pages/products/categories/{category}/index.md`를 만든다.
4. 랜딩 페이지의 `::product-catalog`에 `defaultCategory: {category}`를 넣는다.
5. 랜딩 페이지의 `::store-nav`에 `currentCategory: {category}`를 넣는다.
6. `npm run generate:search-index`와 `npm run smoke:store-navigation`을 실행한다.

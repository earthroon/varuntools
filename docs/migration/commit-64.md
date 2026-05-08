# Commit 64 Migration — Category Landing Pages / Store Navigation Rail

## 추가된 것

```txt
src/components/markdown/StoreNavigationRail.vue
src/markdown/directives/storeNavigationDirective.ts
src/content/pages/products/categories/index.md
src/content/pages/products/categories/templates/index.md
scripts/smoke-store-navigation.mjs
docs/authoring/store-navigation.md
```

## 변경된 것

- `/products` 페이지 상단에 `::store-nav`를 추가했다.
- `ProductCatalog`는 계속 상품 목록/필터 책임만 가진다.
- 카테고리 진입 링크와 count 계산은 `StoreNavigationRail`이 담당한다.
- `/products/categories/templates`는 `defaultCategory: templates`로 templates 상품만 보여준다.

## 검증

```bash
npm run generate:search-index
npm run smoke:store-taxonomy
npm run smoke:store-navigation
npm run smoke:product-filter
npm run smoke:search-index
npm run validate:content
```

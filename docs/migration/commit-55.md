# Commit 55 — Product Filter + Search Index Foundation

## Purpose

Commit 55 separates the product catalog from the homepage section renderer and adds a static search index foundation.

```txt
HomeSection = home / featured display rail
ProductCatalog = product browsing, filtering, sorting rail
```

## Added

```txt
src/components/markdown/ProductCatalog.vue
src/utils/productCatalog.ts
src/markdown/directives/productCatalogDirective.ts
src/search/searchIndex.ts
scripts/generate-search-index.mjs
scripts/smoke-product-filter.mjs
scripts/smoke-search-index.mjs
docs/authoring/search-index.md
public/search-index.json
```

## Changed

```txt
src/content/pages/products/index.md
src/markdown/directiveTypes.ts
src/markdown/directives/index.ts
src/markdown/mountMarkdownComponents.ts
src/styles/markdown-components.css
package.json
scripts/check-launch.mjs
README.md
docs/authoring/store-authoring.md
docs/authoring/launch-checklist.md
```

## Verification

```bash
npm run generate:search-index
npm run smoke:product-filter
npm run smoke:search-index
npm run validate:content
npm run typecheck
node node_modules/vite/bin/vite.js build
```

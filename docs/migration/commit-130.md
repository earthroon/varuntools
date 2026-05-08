# Commit 130 Migration

## Commit

```txt
feat(portfolio): add work taxonomy and filter surface
```

## 기준

Commit 129 navigation UI connection remains the baseline.

## Added

```txt
src/types/workTaxonomy.ts
src/data/workTaxonomy.ts
src/utils/workFilters.ts
src/components/portfolio/WorkFilterChip.vue
src/components/portfolio/WorkTaxonomyBadge.vue
src/components/portfolio/WorkEmptyState.vue
scripts/smoke-work-taxonomy-filter.mjs
docs/authoring/work-taxonomy-filter.md
```

## Content updates

Featured public work pages now carry `work` metadata for taxonomy filtering:

```txt
works/varuntools-showroom
wiper
lab-markdown-gallery
```

## Not changed

```txt
No route rewrite
No navigation redesign
No editorial parser rewrite
No inquiry system change
No full Works content migration
```

## Seal

Commit 130 adds taxonomy and a filter surface. It does not invent new works, and it does not expose hidden/private/noindex pages to the public Works filter.

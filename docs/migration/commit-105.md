# Commit 105 — Site Page Search

`feat(search): add site page search index`

Commit 105 adds a site-wide local page search layer separate from the portfolio-only Works search.

## Added

- `scripts/lib/page-search-index.mjs`
- `scripts/build-page-search-index.mjs`
- `scripts/smoke-page-search.mjs`
- `src/content/generated/page-search-index.json`
- `src/utils/pageSearch.ts`
- `src/composables/usePageSearch.ts`
- `src/pages/SearchPage.vue`
- `src/components/search/PageSearchPanel.vue`
- `src/components/search/PageSearchResults.vue`
- `src/styles/page-search.css`

## Changed

- Added `/search` route.
- Added `build:page-search` and `smoke:page-search` scripts.
- Wired page search build/smoke into `check:launch` before portfolio SEO.
- Added a static `/search` entry to the generated SEO manifest and sitemap.

## Boundaries

- No header search modal.
- No external search library.
- No search analytics.
- No query URL sitemap expansion.
- No tag landing pages yet.

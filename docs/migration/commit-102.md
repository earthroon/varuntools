# Commit 102 — Portfolio Search

`feat(search): add local portfolio search and tag index`

Commit 102 adds local search utilities, facet indexes, and a dedicated Works search panel.

## Added

- `src/utils/portfolioSearch.ts`
- `src/composables/usePortfolioSearch.ts`
- `src/components/works/WorksSearchPanel.vue`
- `scripts/smoke-portfolio-search.mjs`
- `docs/authoring/portfolio-search.md`

## Changed

- `useWorksCollection()` now uses the portfolio search utility for query/filter evaluation.
- Works page now mounts `WorksSearchPanel` with facet counts.
- `check:launch` includes `smoke:portfolio-search`.

## Non-goals

- No external search dependency.
- No server-side search.
- No tag detail pages.
- No search analytics.
- No search result highlighting.

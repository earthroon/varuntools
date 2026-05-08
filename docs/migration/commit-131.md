# Commit 131 Migration

## Commit

```txt
test(content): harden sitemap and search index visibility rules
```

## 기준

Commit 130 work taxonomy and filter surface remains intact.

## Added

```txt
src/content/contentVisibility.ts
src/sitemap/sitemapVisibility.ts
src/sitemap/sitemapCandidates.ts
src/search/searchVisibility.ts
src/search/searchIndexCandidates.ts
scripts/smoke-sitemap-visibility-rules.mjs
scripts/smoke-search-index-visibility-rules.mjs
docs/authoring/sitemap-search-visibility.md
BAKE_REPORT_COMMIT_131.md
```

## What changed

- Page inventory is now used as the input SSOT for sitemap/search visibility checks.
- Hidden/private/draft/noindex pages are excluded from sitemap/search candidates.
- Checkout, QA, editorial preview, dummy, playground, and spec pages are guarded from public indexing candidates.
- Sitemap candidates and search candidates are intentionally separate.
- Search candidates are stricter than sitemap candidates.

## What did not change

```txt
No sitemap XML generator rewrite.
No search engine integration.
No route rewrite.
No page slug migration.
No navigation redesign.
No inquiry/admin/Worker/D1 changes.
```

## Why this commit exists

Navigation guards prevent pages from appearing in menus. They do not automatically prevent pages from being indexed. Commit 131 closes that gap by adding visibility rules for sitemap/search candidates.

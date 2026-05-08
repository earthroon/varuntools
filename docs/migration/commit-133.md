# Commit 133 Migration

## Commit

```txt
test(search): align page search index with visibility rules
```

## Baseline

Commit 132 generated `sitemap.xml` and `robots.txt` from content inventory and sitemap visibility rules.

## What changed

- Public page search index generation now follows content visibility rules.
- `docs/authoring/**` and `docs/migration/**` are removed from the public search index.
- Bake reports are removed from the public search index.
- Internal authoring docs are written to `src/content/generated/internal-docs-search-index.json`.
- New smoke checks guard against public search leaks.

## Outputs

```txt
src/content/generated/page-search-index.json
src/content/generated/internal-docs-search-index.json
```

## Scripts

```txt
npm run search:generate-public-index
npm run search:generate-internal-docs-index
npm run search:generate
npm run smoke:page-search-public-visibility
npm run smoke:page-search-index-boundary
```

## What did not change

- Search UI was not redesigned.
- No external search service was added.
- Sitemap and robots output generation remains intact.
- Navigation and inquiry systems were not changed.

## Seal

Commit 133 aligns the public search index with visibility rules. Public search must not expose hidden, noindex, checkout, QA, dummy, playground, editorial preview, authoring docs, migration docs, or bake reports.

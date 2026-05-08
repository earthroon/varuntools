# Page Search Visibility

Commit 133 separates public site search from internal authoring documentation search.

## Public search index

`src/content/generated/page-search-index.json` is the public search surface used by the site UI.

It is generated from `src/content/pages/**/index.md` and filtered through the content visibility rules.

Included by default:

- public active portfolio pages
- public active works pages
- public active products pages
- public active tools/lab pages

Excluded from public search:

- hidden, private, draft, or noindex pages
- checkout result pages
- QA pages
- claim and inquiry operation pages
- policy pages
- dummy, playground, and spec pages
- editorial showcase / visual QA preview pages
- `docs/authoring/**`
- `docs/migration/**`
- `BAKE_REPORT_COMMIT_*.md`

Public search is for visitors. It must not behave like an internal project file browser.

## Internal docs search index

`src/content/generated/internal-docs-search-index.json` is separated for authoring and maintenance material.

It can include:

- `docs/authoring/**`
- `docs/migration/**`
- `BAKE_REPORT_COMMIT_*.md`

This index is not the public site search source. It exists so authoring docs can remain searchable without leaking into visitor-facing search results.

## Scripts

```txt
npm run search:generate-public-index
npm run search:generate-internal-docs-index
npm run search:generate
npm run smoke:page-search-public-visibility
npm run smoke:page-search-index-boundary
```

## Boundary rule

```txt
page-search-index.json = public visitor search
internal-docs-search-index.json = authoring/internal docs search
```

If a document is useful for maintainers but not for visitors, it belongs in the internal docs index only.

## New page checklist

When adding a page:

1. Add frontmatter title and description.
2. Set `visibility`, `status`, and `robots` intentionally.
3. Run `npm run content:page-inventory`.
4. Run `npm run search:generate`.
5. Run `npm run smoke:page-search-public-visibility`.
6. Confirm private/internal material does not appear in the public index.

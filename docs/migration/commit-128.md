# Commit 128 Migration Notes

## Commit

```txt
feat(navigation): add structured page index and section navigation
```

## Baseline

Commit 127 added generated page inventory and visibility audit reports.

## What changed

```txt
src/navigation/navigationTypes.ts added
src/navigation/pageIndex.ts added
src/navigation/sectionNavigation.ts added
src/navigation/navigationVisibility.ts added
scripts/smoke-navigation-page-index.mjs added
smoke:navigation-page-index added to package.json
smoke:navigation-page-index added to check:launch
```

## What did not change

```txt
No route rewrite
No slug auto-fix
No sitemap rewrite
No search-index rewrite
No page content migration
No inquiry/admin/Worker/D1 changes
No editorial component changes
```

## Inventory-backed guard

`smoke:navigation-page-index` regenerates `generated/page-inventory.json`, reads `src/navigation/pageIndex.ts`, and verifies that public navigation does not include:

```txt
hidden/private/draft pages
noindex pages
checkout pages
QA pages
dummy pages
playground/spec pages
```

## Known page inventory warnings intentionally left unresolved

Commit 128 does not resolve the Commit 127 inventory warnings. They remain audit findings until intentionally fixed in a dedicated commit.

```txt
ROUTE_SLUG_MISMATCH src/content/pages/lab-markdown-gallery/index.md
ROUTE_SLUG_MISMATCH src/content/pages/wiper/index.md
ROUTE_SLUG_MISMATCH src/content/pages/works/index.md
PUBLIC_DUMMY_PAGE src/content/pages/products/dummy-catalog/index.md
PUBLIC_PLAYGROUND_PAGE src/content/pages/products/spec-playground/index.md
```

## Seal

Commit 128 turns the page inventory into a navigation guardrail. Pages may exist without being navigable; public navigation must remain deliberate.

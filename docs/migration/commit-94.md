# Commit 94 — CSV Fixture Suite

```txt
test(csv): add portfolio csv fixture suite
```

Commit 94 adds a fixture suite for the CSV authoring pipeline introduced across commits 87 through 93.

## Added

- `src/content/templates/csv-fixtures/case-study-basic/`
- `src/content/templates/csv-fixtures/gallery-heavy/`
- `src/content/templates/csv-fixtures/tool-showcase/`
- `src/content/templates/csv-fixtures/product-page/`
- `src/content/templates/csv-fixtures/diagnostics-invalid/`
- `scripts/smoke-csv-fixtures.mjs`
- `npm run smoke:csv-fixtures`

## Protected contracts

- portfolio case-study blocks still render
- `frontmatter.work` still emits for work fixtures
- product pages do not gain `frontmatter.work` by accident
- local fixture assets pass the asset guard
- invalid CSV fixtures fail with expected diagnostic codes
- generated Markdown does not leak `[object Object]`
- fixture smoke does not mutate fixture files

## Excluded

This commit does not add visual regression, Playwright screenshots, image optimization, or homepage featured work UI.

# CSV Fixture Suite

Commit 94 adds fixture files for the CSV authoring pipeline. These fixtures are not production pages. They are regression contracts for the parser, renderer, diagnostics, asset guard, portfolio frontmatter, and works collection metadata flow.

## Location

```txt
src/content/templates/csv-fixtures/
```

## Valid fixtures

- `case-study-basic/` protects portfolio case-study blocks, `frontmatter.work`, metric output, quote output, and case gallery rendering.
- `gallery-heavy/` protects regular gallery blocks, case-gallery blocks, local asset references, alt/caption coverage, and asset summary output.
- `tool-showcase/` protects tool-style `work.type`, role/stack/tool arrays, and `work.links` metadata.
- `product-page/` protects product CSV behavior and proves that product pages do not silently generate `frontmatter.work` from root `tags` or `featured` options.

## Invalid fixtures

`diagnostics-invalid/` contains CSV files that must fail with specific diagnostics:

- `missing-required.csv` -> `CSV_REQUIRED_FIELD_MISSING`
- `bad-options.csv` -> `CSV_UNCLOSED_OPTION_QUOTE`
- `missing-asset.csv` -> `CSV_ASSET_MISSING`
- `unsafe-url.csv` -> `CSV_ASSET_UNSAFE_PROTOCOL`

## Rule

A fixture is a contract, not decoration. When adding a new CSV block, option syntax, or asset rule, add or update a fixture that proves the intended behavior.

The smoke test checks markers rather than relying only on full Markdown snapshots. This keeps the suite stable when harmless formatting changes happen, while still catching broken contracts.

```bash
npm run smoke:csv-fixtures
```

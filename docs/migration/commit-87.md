# Commit 87 — CSV block schema and diagnostics

## Commit

`refactor(csv): add block schema validation and precise diagnostics`

## What changed

- Added `scripts/lib/csv-block-schema.mjs` as the CSV block contract SSOT.
- Added `scripts/lib/csv-diagnostics.mjs` for row/block/field/option diagnostics.
- Added `scripts/lib/csv-options.mjs` to isolate legacy option parsing before the v2 parser work.
- CSV rows now preserve `__rowNumber`, `__source`, headers, and duplicate header metadata.
- `csvRowsToMarkdown()` now returns `diagnostics` and `summary` in addition to legacy `warnings` and `errors`.
- `csv-to-markdown.mjs` now supports `--strict` and `--report`.
- Added `smoke:csv-diagnostics` and linked it into `check:launch`.

## Compatibility

Existing CSV files keep working in loose mode. Unknown options are warnings in loose mode and errors in strict mode.

## Excluded

- Quoted/escaped Options Parser v2.
- Portfolio-specific case-study blocks.
- CSV diff/check mode.
- Asset existence validation.

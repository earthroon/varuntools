# Commit 107 — Portfolio Publish Gate

`feat(portfolio): add published work quality gate`

Commit 107 adds a quality gate for portfolio work pages that are public-facing.

## Added

- `scripts/lib/portfolio-publish-gate.mjs`
- `scripts/check-portfolio-publish.mjs`
- `scripts/smoke-portfolio-publish-gate.mjs`
- `src/content/generated/portfolio-publish-report.json`
- `docs/authoring/portfolio-publish-gate.md`

## Behavior

- Checks `published`, `archived`, and existing `active` work pages by default.
- Excludes `draft`, `private`, and hidden work pages by default.
- Supports `--include-draft` for preflight checks.
- Supports `--strict-warnings` to fail on warnings.
- Writes `src/content/generated/portfolio-publish-report.json`.
- Does not auto-fix missing content.

## Launch order

The publish gate should run after generated artifacts are refreshed:

```txt
csv:pages
build:portfolio-assets
build:page-search
build:portfolio-tags
build:portfolio-seo
check:publish
smoke:portfolio-publish-gate
```

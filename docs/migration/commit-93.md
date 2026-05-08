# Commit 93 — CSV Asset Guard

`hardening(csv): validate asset references during csv generation`

Commit 93 adds asset reference validation to the CSV authoring pipeline.

## Added

- `scripts/lib/csv-asset-guard.mjs`
- `smoke:csv-asset-guard`
- Asset summary in CSV `--report` output
- Launch gate connection for the new smoke

## Behavior

CSV generation now checks local and public asset references before writing Markdown.

- Missing local assets are errors.
- Unsafe URL protocols are errors.
- `data:` asset URLs are blocked.
- External HTTPS URLs are warnings in loose mode and errors in strict mode when not allowlisted.
- Missing image alt text is a warning in loose mode and an error in strict mode.

## Scope

This commit only validates references. It does not optimize images, copy files, upload to R2, fetch remote URLs, or sanitize SVG contents.

# Commit 96 Migration: Portfolio Link Guard

`fix(portfolio): validate related works and internal portfolio links`

Commit 96 turns `related-works` from a loose string list into a validated internal-link contract.

## Added

- `scripts/lib/portfolio-link-guard.mjs`
- `scripts/smoke-portfolio-link-guard.mjs`
- `PortfolioRelatedWorks.vue` resolves entries through the Works/page registry instead of showing raw missing strings.
- CSV reports include `portfolio links` summary data.

## Behavior

- `/works/foo` and `works/foo` normalize to `foo`.
- Missing slugs warn in loose mode and fail in strict mode.
- Private targets always fail validation.
- Draft targets warn in loose mode and fail in strict mode.
- Self references warn in loose mode and fail in strict mode.
- External URLs are rejected from `related-works` items.

# Commit 126 migration

## Commit

`content(portfolio): polish featured portfolio copy and editorial rhythm`

## Baseline

Commit 125 added the editorial block showcase and preview surface. Commit 126 keeps the editorial block system intact and applies copy/rhythm polish to featured portfolio content.

## Changed

- Polished `src/content/pages/works/index.md`.
- Polished `src/content/pages/works/varuntools-showroom/index.md`.
- Added `src/markdown/__fixtures__/portfolio-featured-copy-polish.md`.
- Added `docs/authoring/portfolio-copy-rhythm-guide.md`.
- Added `scripts/smoke-portfolio-featured-copy-polish.mjs`.
- Added `BAKE_REPORT_COMMIT_126.md`.

## Not changed

- No editorial parser rewrite.
- No new editorial block types.
- No full portfolio content migration.
- No inquiry system changes.
- No admin inquiry changes.
- No CMS, Notion, or Super integration changes.

## Authoring note

The featured pages now use editorial headings and columns to show the emotional, structural, and technical reading stack. Existing Markdown headings remain valid and intentionally present.

## Verification

Run:

```bash
npm run smoke:portfolio-featured-copy-polish
npm run smoke:portfolio-editorial-content-validation
npm run smoke:portfolio-editorial-showcase
```

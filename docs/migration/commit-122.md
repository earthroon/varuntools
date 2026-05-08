# Commit 122 Migration Notes

## Commit

`content(portfolio): apply editorial blocks to featured portfolio pages`

## 기준

Commit 121 added the portfolio editorial block system.
Commit 122 applies those blocks to selected content without redesigning the renderer.

## Changed

- Applied `editorial-title` to featured portfolio content.
- Applied `editorial-columns` to featured portfolio content.
- Added a real applied fixture at `src/markdown/__fixtures__/portfolio-editorial-applied.md`.
- Added usage examples for major, middle, and minor editorial headings.
- Added usage examples for 2-column and 3-column layouts.
- Added `smoke:portfolio-editorial-applied`.

## Applied pages

- `src/content/pages/works/index.md`
- `src/content/pages/works/varuntools-showroom/index.md`

## Not changed

- Existing Markdown heading behavior is not removed.
- The editorial renderer is not redesigned.
- Full content migration is not required.
- The inquiry system is not modified by this commit.
- No CMS, Notion, or Super integration is changed.

## Why partial application

This commit applies the editorial rhythm to representative pages first.
A full migration would make the content harder to review and would blur whether issues come from the renderer or from specific copy edits.

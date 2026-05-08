# Commit 43 — CSV Authoring Parser / Markdown Generation Pipeline

## Purpose

Adds a CSV authoring pipeline so authors can write `page.csv` and generate VARUNTOOLS Markdown without memorizing every directive syntax.

## SSOT

- `page.csv` is the authoring source for CSV-based pages.
- `index.md` is generated output.
- Direct edits to generated `index.md` can be overwritten by `csv:page`.

## Commands

```bash
npm run csv:page -- src/content/pages/works/project-name/page.csv
npm run csv:pages
npm run new:page -- works project-name --csv
npm run smoke:csv-authoring
```

## Supported blocks

- `page`
- `heading`
- `paragraph`
- `box`
- `image`
- `section-gap`
- `before-after`
- `video`
- `gallery-start`
- `gallery-item`
- `gallery-end`
- `raw`

## Added files

- `scripts/lib/csv.mjs`
- `scripts/lib/csv-markdown.mjs`
- `scripts/csv-to-markdown.mjs`
- `scripts/csv-pages.mjs`
- `scripts/smoke-csv-authoring.mjs`
- `src/content/templates/work.csv`
- `src/content/templates/lab.csv`
- `src/content/templates/tool.csv`
- `docs/authoring/csv-authoring.md`

## Rules

- Unknown block types fail conversion.
- `gallery-item` without `gallery-start` fails conversion.
- `gallery-start` without `gallery-end` fails conversion.
- `page` block must appear exactly once.
- Missing optional authoring details emit warnings rather than silent correction.

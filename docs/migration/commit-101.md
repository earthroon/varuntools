# Commit 101 — Portfolio Authoring Guide v2

`docs(portfolio): publish portfolio authoring guide v2`

Commit 101 adds a single end-to-end authoring guide for the CSV-based portfolio workflow.

## Added

- `docs/authoring/portfolio-authoring-v2.md`
- `scripts/smoke-portfolio-docs.mjs`
- `smoke:portfolio-docs`

## Purpose

The guide connects the workflow from preset generation to publish checks:

```txt
new-page preset
→ page.csv
→ asset replacement
→ csv:pages
→ preview/diff/check/report
→ related-works validation
→ home featured rules
→ publish checklist
```

## SSOT

`docs/authoring/portfolio-authoring-v2.md` is the workflow SSOT.

Feature-specific docs remain as references.

## Non-goals

- No CSV syntax change.
- No new portfolio block.
- No UI or render component change.
- No preset behavior change.

# Commit 91 — CSV Markdown preview and diff report

`feat(csv): add markdown preview and diff report`

## What changed

Commit 91 adds observation modes to `scripts/csv-to-markdown.mjs`:

- `--preview`
- `--diff`
- `--check`
- `--report`
- `--write`

The generated Markdown remains owned by `scripts/lib/csv-markdown.mjs`. The new `scripts/lib/csv-diff-report.mjs` module only compares generated Markdown against the current `index.md` and formats reports.

## Compatibility

`--dry-run` remains supported as an alias for `--preview`.

The default command still writes `index.md`:

```bash
npm run csv:page -- path/to/page.csv
```

Observation modes do not write unless `--write` is passed.

## CI use

Use `--check` to fail when `page.csv` and `index.md` are stale:

```bash
npm run csv:page -- path/to/page.csv --check
```

## Verification

```bash
npm run smoke:csv-preview-diff
npm run smoke:portfolio-frontmatter
npm run smoke:csv-portfolio-blocks
npm run smoke:csv-options
npm run smoke:csv-diagnostics
npm run smoke:csv-authoring
npm run csv:pages
```

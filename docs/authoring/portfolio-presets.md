# Portfolio Presets

Commit 100 adds CSV authoring presets for new portfolio pages.

## Purpose

Presets are starting points, not runtime state. After generation, the generated `page.csv` is the SSOT for the page.

## Available presets

- `case-study` - full case-study page with problem, decision, result, metric, tool stack, and gallery.
- `tool` - tool/web app page with role-stack and tool-stack emphasis.
- `visual` - visual/branding page with gallery-first structure.
- `service` - service/UX/system planning page with process and decision emphasis.
- `experiment` - prototype/research experiment page with metric and quote blocks.

## Usage

```bash
npm run new:page -- works my-case --csv --type case-study
npm run new:page -- works/my-tool --csv --type tool --title "My Tool"
```

Generated files:

```txt
src/content/pages/works/my-case/
  page.csv
  index.md
  cover.svg
  thumb.svg
  images/.gitkeep
  videos/.gitkeep
  README.md
```

`index.md` is generated from `page.csv`. Treat `page.csv` as the authoring SSOT and regenerate Markdown through the CSV pipeline.

## Defaults

New preset pages are safe by default:

```txt
work.status=draft
work.featured=false
work.weight=50
```

This prevents unfinished pages from entering Works/Home featured surfaces accidentally.

## Safety policy

- Existing `page.csv` is never overwritten.
- `--force` may allow using an existing directory, but it still refuses to overwrite `page.csv`.
- Placeholder SVG assets are local files so the CSV asset guard can pass immediately.
- Replace placeholder assets before publishing.

## Related works placeholder

Presets include a `related-works` row with `todo-related-work`. Replace it before publishing or remove the row.

```csv
related-works,관련 작업,,,,,,,,items=[todo-related-work]; layout=grid,
```

## Publish checklist

Before changing `work.status` from `draft`:

- replace `cover.svg` and `thumb.svg`
- update title and summary
- replace `todo-related-work`
- run `npm run csv:pages`
- run `npm run smoke:portfolio-presets`
- run launch checks in a dependency-backed environment

## Full authoring flow

Preset creation is only the first step. Continue through `docs/authoring/portfolio-authoring-v2.md` for CSV editing, asset replacement, related-work validation, home featured behavior, and publish checks.

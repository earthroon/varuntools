# Commit 100 — Portfolio Page Presets

`feat(csv): add portfolio page templates and authoring presets`

## Added

- `src/content/templates/portfolio-presets/`
- Presets: `case-study`, `tool`, `visual`, `service`, `experiment`
- `new-page --type <preset>` support
- `--title`, `--status`, `--featured`, and `--force` options
- `smoke:portfolio-presets`

## Behavior

Preset-generated pages start with:

```txt
work.status=draft
work.featured=false
```

`page.csv` is never overwritten. `--force` can reuse an existing directory, but it still refuses to replace an existing `page.csv`.

## Non-goals

This commit does not add new CSV syntax, new renderer components, search, SEO metadata, sitemap generation, or visual redesign.

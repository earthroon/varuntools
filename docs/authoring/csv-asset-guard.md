# CSV Asset Guard

Commit 93 adds an asset validation pass to CSV-authored pages. The guard does not copy, optimize, download, or rewrite files. It only checks references and reports diagnostics before Markdown is written.

## What is checked

The guard scans asset references from CSV fields and options:

- `page.src`, `page.thumb`
- `portfolio-hero.src`, `portfolio-hero.thumb`
- `product.src`, `product.thumb`
- `image.src`, `image.thumb`
- `before-after.src`, `before-after.options.after`
- `video.src`, `video.thumb`, `video.options.poster`
- `gallery-item.src`, `gallery-item.thumb`
- `case-gallery-item.src`, `case-gallery-item.thumb`

## Path rules

Local relative paths resolve from the directory that contains the `page.csv` file.

```txt
src/content/pages/works/example/page.csv
./images/cover.webp
→ src/content/pages/works/example/images/cover.webp
```

Public absolute paths resolve under `public/`.

```txt
/assets/cover.webp
→ public/assets/cover.webp
```

Relative paths must stay inside the project root. Path traversal outside the project is blocked.

## External URLs

Only `https://` asset URLs are considered safe. External URLs are warnings in loose mode unless the host is allowlisted. In strict mode, non-allowlisted hosts become errors.

Blocked protocols:

- `javascript:`
- `data:`
- `file:`
- `blob:`

Data URLs are blocked because they make CSV files unreviewable and can hide large or unsafe payloads inside a cell.

## Supported extensions

The default supported extensions are:

```txt
.webp .png .jpg .jpeg .svg .avif .gif .mp4 .webm .mov
```

Unsupported extensions are warnings in loose mode and errors in strict mode.

## Accessibility diagnostics

Image-like references should include alt text.

- Loose mode: missing `alt` is a warning.
- Strict mode: missing `alt` is an error.

Gallery and portfolio review images should include captions where useful. Missing captions are warnings.

## Report output

`--report` now includes an asset summary:

```txt
assets:
- checked: 12
- local: 10
- public: 1
- external: 1
- missing: 0
- warnings: 2
- errors: 0
```

## Principle

The asset guard is a validator, not a fixer. It never silently creates files, rewrites paths, or downloads remote assets.

## Authoring reference

For the full portfolio page flow including asset replacement before publish, see `docs/authoring/portfolio-authoring-v2.md`.

## Commit 103 — Portfolio asset manifest

Asset guard checks whether CSV asset references are safe and present. The portfolio asset manifest adds a second layer: usage and loading policy.

```bash
npm run build:portfolio-assets
npm run smoke:portfolio-asset-manifest
```

The generated manifest lives at:

```txt
src/content/generated/portfolio-asset-manifest.json
```

It is derived from `page.csv` and should not be edited by hand.

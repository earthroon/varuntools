# Commit 42 — Content Filing / Page Scaffolding System

## Purpose

Commit 42 adds a content filing and authoring workflow for launch and maintenance.

## Content filing rule

A page owns its local assets.

```txt
src/content/pages/{category}/{slug}/
  index.md
  images/
  videos/
  README.md
```

## Added

- `src/content/templates/work.md`
- `src/content/templates/lab.md`
- `src/content/templates/tool.md`
- `scripts/new-page.mjs`
- `scripts/check-launch.mjs`
- `docs/authoring/*`
- `smoke:content-filing`
- `audit:content`
- `check:launch`

## New page command

```bash
npm run new:page -- works project-name
npm run new:page -- lab experiment-name
npm run new:page -- tools tool-name
```

## Launch commands

```bash
npm run audit:content
npm run check:launch
```

## Rules

- Do not overwrite an existing page folder.
- Do not accept invalid categories.
- Do not accept non-kebab-case slugs.
- Keep page assets local to the page folder.

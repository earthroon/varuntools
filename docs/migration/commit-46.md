# Commit 46 — GitHub Pages Dist Commit Release Workflow

## Purpose

Adds a local release workflow that builds from `main` and commits the generated `dist` contents to the root of the `gh-pages` branch for GitHub Pages.

## Fixed Settings

- Source branch: `main`
- Deploy branch: `gh-pages`
- GitHub Pages folder: `/ root`
- Custom domain: `varun.tools`
- CNAME: always generated
- Dist policy: commit `dist` contents to `gh-pages` root

## Commands

```bash
npm run git:status
npm run release:prepare
npm run release:pages
npm run release:pages -- --push
npm run release:pages -- --dry-run
```

## Rule

`main` is the source of truth. `gh-pages` is generated output. Do not edit `gh-pages` manually.

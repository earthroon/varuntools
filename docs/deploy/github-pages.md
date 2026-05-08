# GitHub Pages Deployment

## Repository Settings

Use the repository Settings UI:

- Default branch: `main`
- Pages source: Deploy from a branch
- Pages branch: `gh-pages`
- Pages folder: `/ root`
- Custom domain: `varun.tools`

## Release

Prepare and create the local deployment commit:

```bash
npm run release:pages
```

Release and push the deployment branch:

```bash
npm run release:pages -- --push
```

Preview the generated deploy payload without switching branches, committing, or pushing:

```bash
npm run release:pages -- --dry-run
```

## Deployment Contract

- `main` is the source branch.
- `gh-pages` is the generated deployment branch.
- GitHub Pages serves the root of `gh-pages`.
- `dist/` is ignored on `main`.
- The contents of `dist/`, not the `dist/` folder itself, are committed to the root of `gh-pages`.
- `CNAME` is always generated with `varun.tools`.
- `.nojekyll` is always generated.

Expected `gh-pages` root after release:

```txt
index.html
404.html
sitemap.xml
assets/
.nojekyll
CNAME
```

`CNAME` must contain exactly:

```txt
varun.tools
```

## Rule

Do not edit `gh-pages` manually.
Build from `main`, then deploy generated `dist` contents to the root of `gh-pages`.

# Commit 104 Migration: Portfolio SEO Manifest

`seo(portfolio): add sitemap and structured metadata`

## Added

- `scripts/lib/portfolio-seo.mjs`
- `scripts/build-portfolio-seo.mjs`
- `scripts/smoke-portfolio-seo.mjs`
- `src/content/generated/portfolio-seo-manifest.json`
- `public/sitemap.xml`
- `public/robots.txt`
- `docs/authoring/portfolio-seo.md`

## New commands

```bash
npm run build:portfolio-seo
npm run smoke:portfolio-seo
```

## Launch flow

Commit 104 wires SEO generation into the content-authoring launch gate after portfolio asset manifest generation.

```txt
csv:pages
→ build:portfolio-assets
→ smoke:portfolio-asset-manifest
→ build:portfolio-seo
→ smoke:portfolio-seo
```

## Notes

- Draft/private/noindex pages are excluded from sitemap output.
- Canonical URLs default to `https://varun.tools` and can be overridden with `SITE_ORIGIN`.
- Generated SEO artifacts are derived outputs, not authoring SSOT.
- This commit does not add SSR/SSG, JSON-LD, RSS, Search Console submission, or Open Graph image rendering.

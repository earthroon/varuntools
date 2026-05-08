# Commit 28 — SEO / OG / Sitemap / Route Metadata Seal

## SSOT

- Page metadata: Markdown frontmatter
- Site metadata: `src/site/siteConfig.ts`
- SEO resolver: `src/site/seo.ts`
- Asset validation: Commit 25 Asset Registry

## Added surface

- Runtime document head update now resolves through the SEO resolver.
- `public/robots.txt` points crawlers to `https://varun.tools/sitemap.xml`.
- `public/og/default-og.svg` is the default OG image.
- `scripts/generate-sitemap.mjs` writes `dist/sitemap.xml` from the content registry/frontmatter.
- `scripts/audit-seo.mjs` checks route metadata, description presence, and OG image candidates.
- `scripts/smoke-seo.mjs` confirms the generated SEO surface exists after build.

## Rule

Do not hardcode routes into sitemap output. Do not silently pretend a missing page-specific OG image exists. If a page has no explicit image, use the default OG image deliberately.

## SPA boundary

This commit provides runtime head updates, default OG metadata, robots, and sitemap. It does not guarantee every social platform will read page-specific OG metadata because many crawlers do not execute SPA JavaScript.

# Sitemap / Robots Generation

## Purpose

This project generates SEO output files from the content page inventory instead of hand-maintaining public URL lists.

Commit 132 adds two generated outputs:

```txt
generated/sitemap.xml
generated/robots.txt
```

The scripts also mirror the outputs to existing runtime locations:

```txt
dist/sitemap.xml
public/robots.txt
```

This keeps the new inventory-backed flow compatible with the existing SEO smoke checks.

## Source of truth

```txt
generated/page-inventory.json
src/content/contentVisibility.ts
src/sitemap/sitemapCandidates.ts
```

`generated/page-inventory.json` lists all content pages and their visibility metadata. The sitemap generator applies the same visibility rules used by the sitemap candidate smoke.

## Commands

```txt
npm run content:page-inventory
npm run seo:generate-sitemap
npm run seo:generate-robots
npm run seo:generate
npm run smoke:sitemap-output
npm run smoke:robots-output
```

## Sitemap rules

A page can appear in `sitemap.xml` when it is:

```txt
visibility: public
status: active
noindex: false
```

The following routes are excluded even if they exist in the content tree:

```txt
/works/editorial-showcase
/products/dummy-catalog
/products/spec-playground
/checkout/success
/checkout/fail
/qa/ewa-gallery
/claim
```

## Robots rules

`robots.txt` includes a permissive default and explicit disallow rules for operational, QA, preview, dummy, and playground routes.

```txt
User-agent: *
Allow: /

Disallow: /checkout/
Disallow: /qa/
Disallow: /works/editorial-showcase
Disallow: /products/dummy-catalog
Disallow: /products/spec-playground
Disallow: /claim

Sitemap: https://varun.tools/sitemap.xml
```

## Important boundary

`robots.txt` is not an access-control or security mechanism. It is only a crawler instruction file. Anything that must be private should not rely on robots rules; it should be protected or removed from public routing.

## Base URL

The scripts use this default:

```txt
https://varun.tools
```

For preview or alternate deployment targets, use:

```txt
SITE_BASE_URL=https://preview.example.com npm run seo:generate
```

## New page checklist

When a new page is added:

```txt
1. Run npm run content:page-inventory
2. Check generated/page-inventory.md
3. Run npm run seo:generate
4. Run npm run smoke:sitemap-output
5. Run npm run smoke:robots-output
```

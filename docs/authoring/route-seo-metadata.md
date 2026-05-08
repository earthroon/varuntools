# Route SEO Metadata

Route-level SEO metadata keeps public pages shareable and predictable.

## SSOT

- `src/site/seoDefaults.ts`: site-wide fallback values
- `src/site/routeSeoManifest.ts`: public route metadata
- `src/site/seo.ts`: canonical and OG helpers
- `generated/page-inventory.json`: visibility source

## Rules

- Public active routes should have `title` and `description`.
- Canonical URLs are generated from `https://varun.tools` and the normalized route path.
- Open Graph metadata falls back to route metadata and then site defaults.
- Hidden, noindex, checkout, QA, dummy, playground, claim, and editorial preview pages do not belong in the public SEO manifest.

## Adding a public page

1. Add the page content and metadata.
2. Run `npm run content:page-inventory`.
3. Add the route to `routeSeoManifest` when it is public/searchable.
4. Run `npm run smoke:route-seo-manifest`.

# Commit 135 Migration

## Commit

`feat(seo): add route-level metadata and Open Graph manifest`

## What changed

- Added route-level SEO metadata types.
- Added site SEO defaults.
- Added canonical URL helper and OG fallback helper exports.
- Added `routeSeoManifest` for public searchable routes.
- Added `smoke:route-seo-manifest`.

## What did not change

- No route rewrite.
- No sitemap/robots redesign.
- No search UI implementation.
- No inquiry/admin/worker changes.

## Visibility rule

The public SEO manifest covers public, searchable routes only. Hidden/noindex/checkout/QA/dummy/playground/editorial-preview routes stay out.

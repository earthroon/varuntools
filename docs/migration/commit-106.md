# Commit 106 — Portfolio Tag Landing Pages

`feat(portfolio): add tag landing pages`

## What changed

- Added `scripts/lib/portfolio-tags.mjs`.
- Added `scripts/build-portfolio-tags.mjs`.
- Added `scripts/smoke-portfolio-tags.mjs`.
- Added generated `src/content/generated/portfolio-tag-index.json`.
- Added `/works/tags/:tag` route.
- Added `WorksTagPage.vue` and `WorksTagLanding.vue`.
- Added SEO/sitemap integration for indexable tag pages.
- Added tag authoring documentation.

## Source of truth

The source is still work metadata. The generated tag index is derived output.

```txt
frontmatter.work.tags / work page tags
-> portfolio-tag-index.json
-> /works/tags/:tag
-> SEO/sitemap entries
```

## Safety policy

- Draft works are excluded.
- Private works are excluded.
- Empty tag pages are not generated.
- Query search URLs remain excluded from the sitemap.
- Tag pages use WorkCard rendering rather than a new card system.

## Build order

```txt
csv:pages
build:portfolio-assets
build:page-search
build:portfolio-tags
build:portfolio-seo
```

Tags must be generated before SEO so `sitemap.xml` can include tag landing pages.

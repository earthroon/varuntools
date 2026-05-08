# Portfolio SEO Manifest

Commit 104 adds derived SEO artifacts for portfolio/content pages.

## SSOT

SEO artifacts are derived from existing content metadata:

- `page.csv`
- generated `index.md` frontmatter
- `frontmatter.work`
- `src/content/generated/portfolio-asset-manifest.json`

Do not hand-edit generated SEO artifacts as authoring source. Rebuild them instead.

```bash
npm run build:portfolio-assets
npm run build:portfolio-seo
npm run smoke:portfolio-seo
```

## Generated files

```txt
src/content/generated/portfolio-seo-manifest.json
public/sitemap.xml
public/robots.txt
```

## SITE_ORIGIN

Default origin is `https://varun.tools`.

```bash
SITE_ORIGIN=https://varun.tools npm run build:portfolio-seo
```

## Indexing policy

Included in sitemap:

- public/published/active pages
- archived pages, unless explicitly noindexed

Excluded from sitemap:

- `draft`
- `private`
- `visibility: hidden`
- `noindex: true`
- `robots: noindex...`

## Fallback priority

### Title

```txt
seoTitle
→ ogTitle
→ title
→ work.title
→ slug
→ VARUNTOOLS
```

### Description

```txt
seoDescription
→ ogDescription
→ description
→ work.summary
→ summary
→ first paragraph excerpt
→ site default description
```

### Image

```txt
ogImage
→ image
→ work.cover
→ cover
→ thumbnail
→ cardCover
→ asset manifest cover role
→ /og/default-og.svg
```

Missing page-specific images emit warnings and fall back to the site default image.

## Warning codes

```txt
PORTFOLIO_SEO_MISSING_TITLE
PORTFOLIO_SEO_MISSING_DESCRIPTION
PORTFOLIO_SEO_MISSING_IMAGE
PORTFOLIO_SEO_IMAGE_MISSING_FILE
PORTFOLIO_SEO_PRIVATE_INDEXED
PORTFOLIO_SEO_DRAFT_INDEXED
PORTFOLIO_SEO_CANONICAL_INVALID
PORTFOLIO_SEO_SITEMAP_EMPTY
```

## Scope limit

This commit does not turn the app into SSR or SSG. It generates stable metadata artifacts and improves the local metadata contract, but crawler behavior for SPA-rendered runtime meta is still bounded by the hosting/runtime model.

## Search route SEO

Commit 105 adds the base `/search` route to the generated SEO manifest and sitemap. Query URLs are intentionally excluded:

```txt
/search        -> may be indexed
/search?q=csv  -> not written to sitemap
```

This prevents thin query-result pages from multiplying in the sitemap.

## Tag landing pages

Commit 106 adds generated tag landing pages to SEO output. Build order matters:

```bash
npm run build:portfolio-tags
npm run build:portfolio-seo
```

Only non-empty indexable tag pages are included in `portfolio-seo-manifest.json` and `public/sitemap.xml`. Search query URLs such as `/search?q=vue` remain excluded.

## Publish gate relation

`npm run check:publish` reads `portfolio-seo-manifest.json` to verify that public work pages have valid canonical URLs and are not accidentally marked as draft/private indexed pages.

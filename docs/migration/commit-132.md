# Commit 132 Migration Notes

## Commit

```txt
feat(seo): generate sitemap and robots outputs from content inventory
```

## Starting point

Commit 131 added inventory-backed visibility guards for sitemap and search candidates. Commit 132 uses the sitemap visibility rule to generate actual SEO output files.

## Added

```txt
scripts/generate-sitemap.mjs
scripts/generate-robots.mjs
scripts/smoke-sitemap-output.mjs
scripts/smoke-robots-output.mjs
generated/sitemap.xml
generated/robots.txt
```

## Updated

```txt
package.json
scripts/check-launch.mjs
public/robots.txt
dist/sitemap.xml
```

`dist/sitemap.xml` and `public/robots.txt` are mirrors for the existing release/SEO smoke flow. The generated SSOT copies live in `generated/`.

## Not changed

```txt
Search index JSON generation
External search engine integration
Route rewrite
Page slug migration
Navigation redesign
Inquiry system
```

## Launch order

```txt
content:page-inventory
seo:generate
smoke:content-page-inventory
smoke:sitemap-visibility-rules
smoke:search-index-visibility-rules
smoke:sitemap-output
smoke:robots-output
```

## Boundary

Commit 132 generates sitemap and robots outputs. It does not introduce a search engine and it does not make robots.txt a privacy boundary.

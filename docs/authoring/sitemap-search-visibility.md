# Sitemap / Search Visibility Rules

Commit 131 adds inventory-backed visibility guards for sitemap and search index candidates.

## Purpose

The site now has portfolio, product, policy, checkout, QA, inquiry, and preview pages. Some pages may exist in the content tree without being suitable for public indexing. This guide defines which pages may appear in sitemap/search candidates and which pages must stay out.

## Input SSOT

```txt
generated/page-inventory.json
```

The inventory is generated from `src/content/pages/**/index.md` and contains route, source, status, visibility, noindex, section, featured, and tags metadata.

## Sitemap inclusion rule

A page may be included in sitemap candidates when all conditions are true:

```txt
visibility = public
status = active
noindex = false
section is not checkout
section is not qa
not an internal preview page
not a dummy / playground / spec page
```

## Search index inclusion rule

Search index candidates are stricter than sitemap candidates.

A page may be included in search candidates when:

```txt
it passes sitemap visibility rules
section is not policies
section is not claim
```

Policies and claim pages may still be reachable by direct links or footer links, but they should not dominate portfolio/product search results by default.

## Always excluded from sitemap/search candidates

```txt
/works/editorial-showcase
/products/dummy-catalog
/products/spec-playground
/checkout/success
/checkout/fail
/qa/ewa-gallery
```

## Warning vs error

```txt
Error:
A page that must be hidden leaks into sitemap/search candidates.

Warning:
A page is public but its indexing policy needs a human decision.
```

## When adding a new page

1. Add frontmatter status and visibility deliberately.
2. Decide whether the page should be indexable.
3. Rebuild the page inventory.
4. Run sitemap/search visibility smoke.
5. Check that preview, QA, checkout, and dummy pages do not leak into public indexing candidates.

## Related scripts

```txt
npm run content:page-inventory
npm run smoke:sitemap-visibility-rules
npm run smoke:search-index-visibility-rules
```

# Navigation Page Index Authoring Guide

## Purpose

The navigation page index is the public navigation SSOT for the site.
It uses the generated content page inventory as its audit source, then defines which pages are allowed to appear in header, footer, section, or utility navigation surfaces.

Commit 128 does not rewrite routes or automatically fix page frontmatter. It only adds a structured navigation contract and a smoke guard that prevents hidden, noindex, checkout, QA, dummy, or playground pages from leaking into public navigation.

## Source of Truth

```txt
Input audit source:
generated/page-inventory.json

Navigation source:
src/navigation/pageIndex.ts
src/navigation/sectionNavigation.ts
src/navigation/navigationTypes.ts
src/navigation/navigationVisibility.ts
```

## Navigation surfaces

```txt
header:
Primary, high-confidence site routes.

footer:
Broader but still public-safe routes.

section:
Section-level page groups that can power cards, rails, or local navigation.

utility:
Operational links such as inquiry.

hidden:
Reserved for pages that must not appear in public navigation.
```

## Inclusion rule

A page can appear in public navigation only when all conditions are true:

```txt
visibility = public
status = active
noindex = false
section is not checkout
section is not qa
source / route does not contain dummy, playground, or spec-only test naming
```

## Explicitly excluded pages

These pages may exist, but they must not be linked from public navigation by default:

```txt
/checkout/success
/checkout/fail
/qa/ewa-gallery
/works/editorial-showcase
/products/dummy-catalog
/products/spec-playground
```

## Current public navigation intent

```txt
Header:
Home
Works
Products
Wiper
Inquiry

Footer:
Home
Works
VarunTools Showroom
Products
Categories
Wiper
Markdown Gallery
Inquiry

Utility:
Inquiry
```

`Lab` currently stays out of the header. It can be surfaced in footer/section navigation as a public lab page, but should not compete with the main portfolio and store routes.

## Adding a new page to navigation

1. Add or update the Markdown page under `src/content/pages`.
2. Run `npm run content:page-inventory`.
3. Check `generated/page-inventory.md` for visibility/noindex warnings.
4. Add a `NavigationItem` to `src/navigation/pageIndex.ts` only if the page is public, active, and indexable.
5. Run `npm run smoke:navigation-page-index`.

## Guardrail

Do not use navigation as a workaround for unresolved page metadata.
If a page is hidden, noindex, QA, checkout, dummy, or playground-like, fix the page status intentionally in a separate commit before adding it to public navigation.

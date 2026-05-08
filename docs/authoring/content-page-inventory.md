# Content Page Inventory Authoring Guide

## Purpose

The content page inventory keeps VARUNTOOLS page visibility auditable as the site grows. It scans `src/content/pages/**/index.md`, reads frontmatter, and generates both machine-readable and human-readable reports.

```txt
SSOT source: src/content/pages/**/index.md
Generated JSON: generated/page-inventory.json
Generated report: generated/page-inventory.md
Smoke: smoke:content-page-inventory
```

## What gets collected

Each page inventory item records:

```txt
source
routePath
slug
title
description
kind
status
visibility
featured
order
robots
noindex
section
tags
```

The inventory does not rewrite pages. It makes page state visible.

## Visibility values

```txt
public  = may appear in normal navigation/search/sitemap flows when other rules allow it
hidden  = available as a page, but should not be promoted as public navigation
private = internal or operator-facing content
 draft  = not ready for public promotion
```

If `visibility` is missing, the generator treats it as `public` and lets audit rules surface suspicious cases.

## Status values

`status` is intentionally loose for now because existing pages use several domain-specific states. The default is `active` when omitted.

Recommended values:

```txt
active
coming-soon
archived
draft
```

## Featured rule

A hidden/private/draft page must not be `featured: true`.

```txt
hidden/private/draft + featured: true = error
```

This prevents private QA surfaces and hidden previews from leaking into featured cards.

## Noindex rule

Use `robots: "noindex,follow"` or `noindex: true` for pages that should not enter search surfaces.

Recommended noindex candidates:

```txt
checkout/success
checkout/fail
claim
qa/*
works/editorial-showcase
products/dummy-catalog
products/spec-playground
```

The inventory begins with warnings for many of these cases rather than auto-fixing them.

## Warning and error codes

Warnings ask for human review. Errors block the inventory smoke.

```txt
ROUTE_SLUG_MISMATCH       slug and derived route path differ
HIDDEN_FEATURED_PAGE      hidden/draft page is featured
PRIVATE_FEATURED_PAGE     private page is featured
PUBLIC_DUMMY_PAGE         public page path contains dummy
PUBLIC_PLAYGROUND_PAGE    public page path contains playground/spec
QA_PAGE_PUBLIC            QA page is public
CHECKOUT_PAGE_INDEXABLE   checkout page lacks noindex
MISSING_TITLE             page has no title frontmatter
OBJECT_OBJECT_LEAK        source contains object serialization leak
```

## Commands

```bash
npm run content:page-inventory
npm run smoke:content-page-inventory
```

## New page checklist

When adding a page, set these fields deliberately:

```yaml
title: "Page title"
slug: "section/page-slug"
kind: "page"
status: "active"
visibility: "public"
featured: false
robots: "noindex,follow" # when needed
order: 10
```

Do not rely on the inventory generator to repair metadata. It reports state; it does not silently correct it.

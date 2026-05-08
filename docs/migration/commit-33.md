# Commit 33 — Manual Gallery Strip

## Purpose

Add explicit manual gallery strips for authored image groups while keeping Commit 32 automatic section mini galleries intact.

## Syntax

```md
::gallery-strip
title: Manual Gallery
layout: strip
lightbox: true
::
- ./images/a.svg | Caption A
- ./images/b.svg | Caption B
::
```

Each item line uses:

```txt
- src | caption | thumb
```

`thumb` is optional. When omitted, the source image is reused as the thumbnail.

## Layouts

- `strip`: horizontal scrolling strip
- `grid`: responsive grid
- `compact`: dense horizontal strip

## Rules

- Manual gallery uses the existing section lightbox UI.
- Manual gallery dispatches `vt:open-gallery` and does not create a separate lightbox state store.
- Sections containing a manual gallery do not receive duplicate auto mini galleries.
- `gallery.autoMini: false` can disable automatic mini gallery generation for a page.
- Missing assets are not silently replaced.

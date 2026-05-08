# Commit 24 — Markdown Renderer Safety / Nested Directive Boundary

## Purpose

Commit 24 seals the renderer boundary for `markdown-box` bodies.

`markdown-box` body content is treated as a plain Markdown fragment. Vue-backed Markdown directives must stay as top-level blocks, not inside a `markdown-box` body.

## Allowed inside markdown-box

- Paragraphs
- Lists
- Inline links
- Inline code
- Code fences
- Blockquotes
- Plain Markdown images

## Not supported inside markdown-box

- `::pagecard-grid`
- `::before-after`
- `::captioned-image`
- `::markdown-box`
- `::section-gap`
- `::section-break`
- `::image-card`
- `::featured-works`
- `::work-card`
- `::video`

## Renderer policy

When a nested Vue directive is found inside a `markdown-box` body, the renderer emits a visible `.vt-directive-error` placeholder instead of silently rendering or recursively mounting the nested directive.

## Validation policy

`validate:content` reports nested directives in `markdown-box` as warnings. It does not hard-fail the build by default, but the rendered page will show the directive warning placeholder.

## Migration rule

Move nested directives outside the box:

```md
::markdown-box
type: ssot
title: 기준
::
이 박스에는 설명만 둔다.
::

::pagecard-grid
items:
  - /tools/wiper
::
```

## Do not do this

Do not call `mountMarkdownComponents()` recursively inside `MarkdownBox.vue`. That would blur component ownership and can duplicate handlers for lightbox, before/after sliders, and router links.

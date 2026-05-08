# Commit 47 — Lightbox Control Visibility / Button Alignment Fix

## Purpose

Fix lightbox control visibility and action button alignment regressions.

## Rules

- Close/prev/next icons must remain visible on bright and dark image backgrounds.
- Control glyphs are wrapped in `.vt-lightbox__control-icon`.
- Close/prev/next controls use grid centering.
- Action buttons use flex centering.
- Anchor actions and button actions share the same alignment contract.
- Mobile controls preserve touch-target sizing.

## Scope

- `MarkdownLightbox.vue`
- `markdown-lightbox.css`
- `smoke:lightbox-controls`

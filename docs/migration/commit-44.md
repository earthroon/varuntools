# Commit 44 — Responsive UI Layout / Mobile Polish Pass

## Purpose

Normalize responsive behavior across Markdown components, gallery UI, lightbox, video, and authoring docs.

## Breakpoints

- desktop: >= 1024px
- tablet: <= 1023px
- mobile: <= 719px
- small mobile: <= 420px
- hoverless: `(hover: none)` / `(pointer: coarse)`

## Rules

- Mobile disables hover magnifier.
- Lightbox metadata must not consume the entire viewport.
- Thumbnail trays remain horizontally scrollable.
- Touch targets remain usable.
- Markdown tables and code blocks should not overflow the viewport.

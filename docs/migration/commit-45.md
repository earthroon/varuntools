# Commit 45 — Responsive Regression Fix / Wide Screen Density Clamp

## Purpose

Fix the Commit 44 responsive regression where wide screens inflated typography and duplicated layout responsibility between the page shell and the markdown body.

## Rules

- Wide screens must not inflate every UI element.
- Text content uses `--vt-content-max`.
- Media components may use `--vt-media-max`.
- Page shell owns outer padding.
- Markdown body owns reading width.
- H1 max size stays below billboard scale.
- Existing mobile/touch responsive polish remains in place.

## Changed

- Split `--vt-content-max`, `--vt-content-wide-max`, and `--vt-media-max`.
- Removed the grouped `.vt-markdown, .vt-markdown-page` width/padding selector.
- Restored bounded typography clamps for markdown headings and text.
- Lowered markdown box density and lightbox desktop max-height.
- Strengthened `smoke:responsive-ui` with wide-screen regression guards.

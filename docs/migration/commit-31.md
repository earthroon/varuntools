# Commit 31 — Section Scoped Lightbox / Thumbnail Tray

Lightbox galleries are scoped by visual section boundaries, not by the whole page.

## Boundary

- `section-gap`
- `hr`
- `.vt-section-gap`
- `[data-vt-section-gap="1"]`

## Behavior

- Clicking an image opens only the current section's gallery.
- The thumbnail tray shows only images from the current section.
- Images from other sections must not appear in the same lightbox group.
- Pagecard thumbnails, video posters, before/after internals, and decorative images are excluded.

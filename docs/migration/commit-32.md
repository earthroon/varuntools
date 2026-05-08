# Commit 32 — Inline Mini Gallery Strip

## Rule

Mini galleries are generated from section-scoped lightbox groups.

## Behavior

- Sections with 2+ lightbox images get a mini gallery strip.
- Clicking a mini gallery thumb opens the section lightbox.
- Images from other sections must not appear.
- Pagecard thumbnails, video posters, before-after images, and lightbox thumbnail images are excluded.

## Boundary

Uses the same section boundary as Commit 31:

- `section-gap`
- `hr`
- `.vt-section-gap`
- `[data-vt-section-gap="1"]`

## Safety

Mini gallery hosts are removed during lightbox cleanup so repeated document remounts do not duplicate gallery strips.

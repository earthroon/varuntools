# Commit 39 — Captioned Image Frame / Badge Overlay Fix

## Purpose

CaptionedImage is an atomic image surface. Its badge, help button, and tooltip must belong to the image frame, not the surrounding document flow.

## Rules

- `badge`, help button, and tooltip are rendered inside `.vt-captioned-image__frame`.
- The frame owns `position: relative`.
- Badge/help/tooltip use absolute overlay positioning.
- Badge text must not wrap or switch to vertical writing.
- Mini gallery hosts are inserted after `figure.vt-captioned-image`, not inside the frame.
- The source image remains the only `data-vt-lightbox="1"` target.

## Validation

```bash
npm run smoke:captioned-image
```

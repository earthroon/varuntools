# Commit 34 — Gallery Pointer Magnifier

## Rule

Gallery thumbnails can show a fixed magnifier box. The box stays fixed, but the magnified area follows the pointer coordinate over the source image.

## Click contract

- Single click disables the magnifier for that image.
- Only a second click on the same image within 100ms re-enables it.
- Slow double clicks are treated as two single clicks.
- Native `dblclick` is not the SSOT.

## Scope

Applied to gallery thumbnail images:

- `.vt-gallery-strip__thumb img`
- `.vt-mini-gallery__thumb img`
- `.vt-lightbox__thumb img`

Not applied to before-after images, video posters, pagecards, or main captioned images.

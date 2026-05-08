# Commit 40 — Caption Tooltip Trigger Fix

## Rule

CaptionedImage tooltip must open only from the `?` help button hover/focus state.

## Fixed

- Removed frame-wide hover/focus-within tooltip trigger.
- Added explicit tooltip open state in `CaptionedImage.vue`.
- Added `aria-expanded` sync on the help button.
- Tooltip visibility now uses `data-open="1"`.

## Not allowed

- `.vt-captioned-image__frame:hover .vt-captioned-image__tooltip`
- `.vt-captioned-image__frame:focus-within .vt-captioned-image__tooltip`

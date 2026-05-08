# Commit 41 — Caption Tooltip Strict Trigger Fix

## Purpose

CaptionedImage tooltips must not open from image/frame hover, image click, focus residue, or JS state.

## Rule

The tooltip opens only when the `?` help button is hovered or keyboard `:focus-visible`.

Allowed triggers:

- `.vt-captioned-image__help:hover ~ .vt-captioned-image__tooltip`
- `.vt-captioned-image__help:focus-visible ~ .vt-captioned-image__tooltip`

Forbidden triggers:

- `.vt-captioned-image:hover`
- `.vt-captioned-image__frame:hover`
- `.vt-captioned-image:focus-within`
- `.vt-captioned-image__frame:focus-within`
- `data-open` tooltip state
- JS tooltip open state such as `isTooltipOpen`

## Accessibility

The help button keeps `aria-describedby`, and the tooltip keeps `role="tooltip"`.
`aria-expanded` is intentionally not used because this is not a disclosure panel.

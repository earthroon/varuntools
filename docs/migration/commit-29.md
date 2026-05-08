# Commit 29 — BeforeAfter Overlay Wiper Contract Fix

## SSOT

`BeforeAfterWiper` is an overlay wiper component, not a side-by-side comparison layout.

## Required structure

- One shared stage owns the aspect ratio.
- The before image fills the shared stage.
- The after image fills the same shared stage.
- The after image is clipped by slider percent using `clip-path`.
- Divider and handle move over the same stage.
- Static `BEFORE` / `AFTER` UI labels are not rendered by the component.

## Not allowed

- Independent before/after boxes.
- Per-image layout ownership.
- Width-based after wrappers that shrink the after image.
- Demo labels as component UI.
- `contain`-based separated preview layout.

## Visual QA

The lab Markdown gallery uses label-free before/after SVGs with matching viewBox dimensions so the overlay contract is visually checkable.

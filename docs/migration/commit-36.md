# Commit 36 — Mobile Pinch Zoom / Touch Gallery Polish

## Purpose

Commit 36 seals mobile gestures for the lightbox image viewer.

## Contract

- Two-finger pinch changes zoom between `1x` and `4x`.
- One-finger drag pans only when `zoom > 1`.
- Horizontal swipe navigates previous/next only when `zoom <= 1`.
- Double tap is strict: `220ms` and `28px` distance.
- Double tap at `1x` zooms to `2x`.
- Double tap while zoomed resets zoom/pan.
- Thumbnail tray keeps horizontal scrolling with `touch-action: pan-x`.
- Toolbar buttons and keyboard shortcuts remain available.

## Non-goals

- Pinch focal point correction.
- Bounds-aware pan clamp.
- Inertial/rubber-band physics.
- Mobile-only bottom sheet UI.

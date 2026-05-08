# Commit 37 — Lightbox Bounds-Aware Pan Clamp / Focal Zoom Polish

## Purpose

Commit 37 stabilizes lightbox zoom and pan behavior by adding bounds-aware pan clamping and focal-point zoom correction.

## Rules

- Pan bounds are derived from the stage size, contained image base size, and current zoom.
- Zoom `1x` always resets pan to `{ x: 0, y: 0 }`.
- Pointer drag pan and touch pan must pass through `clampPan`.
- `Ctrl + wheel` zoom uses the mouse position as the focal point.
- Mobile double tap zoom uses the tap position as the focal point.
- Pinch zoom uses the two-finger center as the focal point.
- Resize reclamps the current pan.

## Non-goals

- Inertial pan
- Rubber-band physics
- Deep zoom tiles
- Keyboard pan
- Minimap navigator

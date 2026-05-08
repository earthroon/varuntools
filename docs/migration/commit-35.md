# Commit 35 — Lightbox Zoom / Pan Inspection Mode

## Purpose

The lightbox main image now supports inspection controls:

- zoom in / zoom out
- reset to 1x
- pointer drag pan while zoomed
- `+`, `-`, and `0` keyboard shortcuts
- `Ctrl + wheel` zoom on the lightbox stage

## Contract

- Zoom is scoped to the current lightbox image.
- Changing images resets zoom and pan.
- Closing the lightbox resets zoom and pan.
- ArrowLeft / ArrowRight keep their gallery navigation role.
- Pan is only active when zoom is greater than 1x.

## Limits

- Minimum zoom: 1x
- Maximum zoom: 4x
- Step: 0.5x

## Out of scope

- pinch zoom
- keyboard panning
- deep zoom tiles
- annotation or crop tools

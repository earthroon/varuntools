# Commit 109C Migration

`test(media): add EWA gallery visual QA and browser diagnostics`

This commit adds a diagnostic surface for the lazy WebGPU EWA gallery path.

## Added

- `src/media/ewa/ewaDiagnostics.ts`
- `src/components/markdown/EwaDebugPanel.vue`
- `src/components/markdown/EwaCompareView.vue`
- `src/styles/ewa-debug.css`
- `scripts/smoke-ewa-visual-qa.mjs`
- `docs/authoring/ewa-visual-qa.md`

## Behavior

- Default lightbox UI remains unchanged when `vt:ewa-debug` is not enabled.
- Debug mode can show original / processed / fixed split compare views.
- EWA timing diagnostics are recorded for decode, upload, compute, presentation, and total processing.
- Fallback reasons remain visible to the debug panel, not to normal users.

## Not included

- Adaptive tile EWA
- Qmap-aware EWA
- draggable compare slider
- image export
- build-time derivatives

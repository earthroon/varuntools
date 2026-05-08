# Commit 112 Migration

```txt
perf(media): add EWA runtime health guard and session cooldown
```

## What changed

Commit 112 adds a session-scoped runtime health guard for the lazy WebGPU EWA gallery processor.

New files:

```txt
src/media/ewa/ewaRuntimeHealth.ts
src/media/ewa/ewaCooldown.ts
scripts/smoke-ewa-runtime-health.mjs
docs/authoring/ewa-runtime-health.md
docs/migration/commit-112.md
BAKE_REPORT_COMMIT_112.md
```

Modified files include:

```txt
src/media/ewa/ewaTypes.ts
src/media/ewa/ewaDiagnostics.ts
src/media/ewa/ewaGalleryProcessor.ts
src/components/markdown/EwaDebugPanel.vue
package.json
scripts/check-launch.mjs
```

## Runtime policy

The active lightbox image path now checks runtime health before attempting WebGPU EWA.

```txt
healthy/degraded
→ continue with device tier / quality budget

cooldown/disabled
→ original fallback
```

Repeated timeout, device lost, or repeated fallback can move the current browser session into cooldown.

## SSOT

Runtime health is not SSOT.

```txt
SSOT:
page.csv
MarkdownLightbox active item
EWA preset contract

runtime only:
health state
cooldown
failure counters
recommended tier
```

The patch does not change source images, generated manifests, or page metadata.

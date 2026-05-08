# Commit 113 Migration

```txt
feat(media): add EWA rollout gate and runtime feature flags
```

## What changed

Commit 113 adds a rollout gate in front of the active lightbox EWA processor.

New files:

```txt
src/media/ewa/ewaFeatureFlags.ts
src/media/ewa/ewaRolloutGate.ts
scripts/smoke-ewa-rollout-gate.mjs
docs/authoring/ewa-rollout-gate.md
```

Updated files:

```txt
src/media/ewa/ewaTypes.ts
src/media/ewa/ewaDiagnostics.ts
src/media/ewa/ewaGalleryProcessor.ts
src/components/markdown/EwaDebugPanel.vue
package.json
scripts/check-launch.mjs
```

## Default behavior

The default rollout mode is:

```txt
metadata-only
```

This means EWA is allowed only for active lightbox images that carry explicit EWA media metadata from `page.csv`, such as:

```txt
media.ewaPreset=ui-low-ring
media.ewaMode=adaptive-tile
media.ewaEnabled=true
```

## Debug override

```js
localStorage.setItem('vt:ewa-debug', 'true')
localStorage.setItem('vt:ewa-rollout', 'enabled')
```

## SSOT rule

The rollout gate does not modify `page.csv`, generated manifests, or image files. It only decides whether the active lightbox image may enter the runtime EWA path.

# Commit 98 Migration: Dependency-backed launch validation

`chore(validation): restore full dependency-backed launch verification`

Commit 98 reorganizes launch validation so dependency readiness is checked before the launch gate begins running content, worker, and build checks.

## Added

- `scripts/check-dependency-runtime.mjs`
- `npm run check:deps`
- grouped `scripts/check-launch.mjs` execution
- per-step timeout handling via `VT_CHECK_LAUNCH_STEP_TIMEOUT_MS`
- launch validation authoring docs

## Behavior

`npm run check:launch` now begins with `check:deps`. If root `node_modules` is missing, it fails immediately with clear instructions to run `npm ci`.

## Non-goals

- No new UI feature.
- No SEO or search change.
- No portfolio render behavior change.
- No replacement for dependency installation.

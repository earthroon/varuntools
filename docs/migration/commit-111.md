# Commit 111 Migration

## Commit

```txt
perf(media): add EWA device tier and quality budget
```

## Summary

Commit 111 adds runtime device-tier detection and quality budgets to the lazy EWA lightbox processor.

## New files

- `src/media/ewa/ewaDeviceTier.ts`
- `src/media/ewa/ewaQualityBudget.ts`
- `scripts/smoke-ewa-quality-budget.mjs`
- `docs/authoring/ewa-quality-budget.md`

## Runtime behavior

- WebGPU unsupported devices bypass EWA.
- Low-tier devices clamp target size to 960 and disable adaptive tile mode.
- Medium-tier devices allow adaptive tile mode with 1440 target cap.
- High-tier devices allow adaptive tile mode with 1920 target cap.
- Cache entries and timeout now follow budget.

## Non-goals

- No new shader algorithm.
- No global image processing.
- No WorkCard GPU processing.
- No build-time derivative generation.

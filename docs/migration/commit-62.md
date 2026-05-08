# Commit 62 Migration — Screenshot Baseline Diff / Visual Regression Compare

## What changed

Commit 62 adds a dependency-light visual regression comparison layer for the existing Playwright screenshot harness.

Added commands:

```bash
npm run qa:baseline
npm run qa:diff
npm run qa:diff:strict
npm run qa:diff:summary
npm run smoke:visual-diff
```

## Workflow

1. Capture current screenshots with `npm run qa:screenshots`.
2. Promote accepted screenshots with `npm run qa:baseline`.
3. Capture again after a UI change.
4. Compare current against baseline with `npm run qa:diff`.
5. Use `npm run qa:diff:strict` during release review.

## Guardrails

- `qa:diff` never modifies baseline images.
- Missing baseline is a warning in normal mode.
- Missing current screenshot is an error.
- Dimension mismatch is an error.
- Diff images and reports are generated artifacts.

## Why this is separate from Commit 61

Commit 61 only creates the camera. Commit 62 adds the comparer. Keeping them separate avoids a heavy screenshot/diff workflow from silently becoming part of launch checks before the baseline policy is decided.

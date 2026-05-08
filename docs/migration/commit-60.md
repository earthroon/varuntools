# Commit 60 — Visual QA Matrix / Launch Screenshot Checklist

## Summary

Commit 60 adds the manual launch QA pack for VARUNTOOLS. It fixes the required viewport list, required pages, interaction checks, pass/warning/blocker language, screenshot naming rules, and run report template.

## Added

- `docs/qa/launch-qa-matrix.md`
- `docs/qa/manual-screenshot-checklist.md`
- `docs/qa/qa-run-template.md`
- `scripts/smoke-launch-qa-pack.mjs`
- `npm run smoke:launch-qa`

## Updated

- `package.json`
- `scripts/check-launch.mjs`
- `README.md`
- `docs/authoring/launch-checklist.md`

## Non-goals

- No Playwright screenshot automation.
- No image diff automation.
- No Lighthouse automation.
- No layout redesign.
- No runtime feature changes.

## Verification

```bash
npm run smoke:launch-qa
npm run check:launch
```

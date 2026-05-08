# Commit 61 Migration — Playwright Screenshot Harness / Visual Regression Prep

## Summary

Commit 61 adds a Playwright-based screenshot capture harness for the launch QA matrix introduced in Commit 60.

```txt
Commit 60 = QA matrix and manual checklist
Commit 61 = repeatable screenshot capture harness
```

## Added

```txt
playwright.config.mjs
scripts/qa/visual-routes.mjs
scripts/qa/capture-screenshots.mjs
scripts/smoke-playwright-screenshots.mjs
docs/qa/playwright-screenshot-harness.md
docs/migration/commit-61.md
```

## Updated

```txt
package.json
.gitignore
scripts/check-launch.mjs
README.md
docs/authoring/launch-checklist.md
docs/qa/launch-qa-matrix.md
docs/qa/manual-screenshot-checklist.md
docs/qa/qa-run-template.md
```

## New commands

```bash
npm run qa:screenshots
npm run qa:screenshots:headed
npm run qa:screenshots:dry-run
npm run smoke:playwright-screenshots
```

## Output

```txt
artifacts/qa/screenshots/current/{viewport}/{route}.png
```

## Non-scope

Commit 61 does not add visual diff assertions, baseline approval, CI artifact upload, full E2E tests, payment tests, Google Form live submission tests, or automatic launch blockers.

## Launch check

`check:launch` runs `smoke:playwright-screenshots`, not the heavy screenshot capture command.

Run actual capture manually when needed:

```bash
npm run build
npm run qa:screenshots
```

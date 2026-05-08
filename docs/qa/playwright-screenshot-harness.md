# Playwright Screenshot Harness

Commit 61 adds a reproducible screenshot harness for launch QA. It follows the manual QA matrix from Commit 60 and captures the required launch routes at the required viewport widths.

## Scope

This is a screenshot capture harness only.

It does not introduce visual regression assertions, baseline approval, pixel diff failure, Percy, Chromatic, Lighthouse, full E2E testing, payment testing, Google Form live submission testing, or CI artifact upload.

```txt
Commit 60 = what humans should inspect
Commit 61 = camera for repeatable screenshots
Commit 62+ = possible baseline / visual regression / diff policy
```

## Commands

```bash
npm run smoke:playwright-screenshots
npm run qa:screenshots
```

Optional commands:

```bash
npm run qa:screenshots:headed
npm run qa:screenshots:dry-run
npm run qa:screenshots -- --base-url=http://127.0.0.1:4173
```

## Output

Screenshots are written to:

```txt
artifacts/qa/screenshots/current/{viewport}/{route}.png
```

Examples:

```txt
artifacts/qa/screenshots/current/desktop-1440/home.png
artifacts/qa/screenshots/current/mobile-390/inquiry.png
artifacts/qa/screenshots/current/tablet-768/product-dummy-catalog.png
```

The screenshot artifact folders are ignored by git by default. Commit 61 does not store baseline images.

## Route SSOT

The Playwright route list lives in:

```txt
scripts/qa/visual-routes.mjs
```

Required launch routes:

```txt
/
/products
/products/dummy-catalog
/inquiry
/lab-markdown-gallery
/policies
/policies/store
/policies/shipping
/policies/refund
/policies/privacy
/policies/digital-download
```

## Viewport SSOT

The viewport list also lives in:

```txt
scripts/qa/visual-routes.mjs
```

Required viewport names:

```txt
desktop-1440
desktop-1280
tablet-1024
tablet-768
mobile-430
mobile-390
mobile-360
```

## Execution model

By default `qa:screenshots` checks whether `http://127.0.0.1:4173` is reachable.

- If a server is already running, it uses that server.
- If no server is running and no explicit `--base-url` was supplied, it starts `npm run preview -- --host 127.0.0.1 --port 4173`.
- If `--base-url` or `QA_BASE_URL` is supplied and unreachable, the command fails instead of silently starting another server.

Before running screenshots, make sure the site has been built or that the chosen server command can serve the site.

```bash
npm run build
npm run qa:screenshots
```

## Stability rules

The browser context fixes:

```txt
colorScheme: light
reducedMotion: reduce
fullPage screenshots
```

Default capture state:

```txt
Command Palette closed
Lightbox closed
Inquiry form empty
No hover/focus interaction state
No Google Form live submission
```

Interaction-state screenshots remain manual in Commit 61.

## Failure checks

If screenshots fail:

1. Run `npm run smoke:playwright-screenshots`.
2. Run `npm run qa:screenshots:dry-run` to confirm route and output plans.
3. Confirm the app can be served locally.
4. Confirm Playwright is installed.
5. Run `npx playwright install chromium` if the browser binary is missing.
6. Retry with `npm run qa:screenshots:headed` when visual debugging is needed.

## Baseline and diff policy

Baseline images and visual regression diff policy are not introduced here.

Do not treat `artifacts/qa/screenshots/current/**` as SSOT. These files are observation records for a specific build/viewport/route run.

A future commit can define:

```txt
artifacts/qa/screenshots/baseline/
artifacts/qa/screenshots/diff/
threshold rules
warning/blocker rules
CI artifact policy
```

# Commit 103 — Portfolio Asset Manifest

`perf(media): add portfolio asset manifest and lazy media policy`

Commit 103 adds a generated portfolio asset manifest and codifies media loading policy without introducing image optimization or external media tooling.

## Added

- `scripts/lib/portfolio-asset-manifest.mjs`
- `scripts/build-portfolio-asset-manifest.mjs`
- `scripts/smoke-portfolio-asset-manifest.mjs`
- `src/content/generated/portfolio-asset-manifest.json`
- `docs/authoring/portfolio-asset-manifest.md`

## Updated

- `PortfolioHero.vue` now treats the hero image as eager/high-priority media.
- Gallery and card image lazy/async policies are verified by smoke.
- `check:launch` content-authoring group runs manifest build and smoke.

## Non-goals

- No image compression.
- No responsive srcset generation.
- No blur placeholder or LQIP.
- No CDN/R2 upload.

# Commit 114 Migration

```txt
test(media): add EWA fixture gallery and QA scenarios
```

## What changed

Commit 114 adds a hidden noindex QA gallery at `/qa/ewa-gallery` with synthetic fixture images for validating the EWA gallery processor across representative image types.

## Added

- `src/content/pages/qa/ewa-gallery/page.csv`
- `src/content/pages/qa/ewa-gallery/index.md`
- `public/qa/ewa-fixtures/*`
- `scripts/smoke-ewa-fixture-gallery.mjs`
- `docs/authoring/ewa-fixture-gallery.md`

## QA coverage

The fixture gallery includes scenarios for:

- photo baseline
- UI screenshot low-ring adaptive mode
- line-art adaptive mode
- pixel-safe bypass
- explicit EWA disabled image
- low-tier budget downgrade

## Indexing policy

The fixture page is hidden and noindex:

```txt
visibility: hidden
robots: noindex,follow
noindex: true
```

It must remain out of sitemap, page search, tag index, works collection, and publish gate flows.

## Verification

```bash
npm run smoke:ewa-fixture-gallery
npm run smoke:ewa-rollout-gate
npm run smoke:ewa-runtime-health
npm run smoke:ewa-quality-budget
```

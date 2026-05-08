# Final Asset Pass

Run this pass before flipping from `prelaunch` to `launch-candidate` or `production`.

## Required checks

```bash
npm run audit:images
npm run audit:launch-readiness
npm run generate:search-index
npm run smoke:search-index
npm run validate:content
```

## Asset checklist

- Every public page has a deliberate `cover` or a documented reason for not using one.
- Every public store page has a `thumbnail`.
- Every launch-critical page has `ogImage`.
- Gallery items have thumbs or intentionally use the same source as the thumb.
- Demo SVG covers are replaced, hidden, or explicitly accepted as prelaunch scaffolds.
- Non-webp raster assets are reviewed before launch.

## Warning policy

In `prelaunch`, image warnings are signals.
In `production`, `failOnImageWarnings` can turn those signals into blockers.

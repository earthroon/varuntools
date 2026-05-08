# Launch Content Freeze

Commit 66 freezes the launch-readiness contract for VARUN Tools.

This document does not delete demo content automatically. It makes every launch-sensitive item visible before release.

## SSOT

```txt
src/config/launchReadiness.ts
scripts/audit-launch-readiness.mjs
```

## Modes

### prelaunch

- Demo product pages may stay public.
- Google Form wiring may stay disabled.
- Policy pages may remain draft-review text.
- OG/thumbnail image warnings stay warnings.
- Screenshot baseline may be missing.

### launch-candidate

Use this when the site is almost ready for public release.

Recommended changes:

```ts
launchMode: 'launch-candidate'
allowDemoProducts: false
requireGoogleFormConnection: true
requirePolicyReviewFlag: true
requireOgImages: true
requireThumbnails: true
requireScreenshotBaseline: true
```

### production

Use this when the site is actually published as a store.

Recommended changes:

```ts
launchMode: 'production'
allowDemoProducts: false
requireGoogleFormConnection: true
requirePolicyReviewFlag: true
requireOgImages: true
requireThumbnails: true
requireScreenshotBaseline: true
failOnImageWarnings: true
```

## Commands

```bash
npm run audit:launch-readiness
npm run smoke:launch-freeze
```

`audit:launch-readiness` reads the config and reports blockers, warnings, and notes.
`smoke:launch-freeze` verifies the launch-freeze files, scripts, docs, and launch wiring.

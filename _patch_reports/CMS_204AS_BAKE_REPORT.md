# CMS-204AS Bake Report

## Patch

CMS-204AS Live Materialized Source Commit Back / Main Branch Content Persistence Seal

## Implemented

- Added `scripts/commit-vacms-materialized-source.mjs`.
- Added workflow source commit step immediately after materialization.
- Added source commit receipt to upload artifacts.
- Added source commit receipt consumption to deploy evidence.
- Added source commit requirement to live deploy finalize.
- Added static guard `scripts/cms-204as-live-materialized-source-commit-back-guard.mjs`.

## Verification

Static guard expected status:

```txt
PASS_CMS_204AS_LIVE_MATERIALIZED_SOURCE_COMMIT_BACK_MAIN_BRANCH_CONTENT_PERSISTENCE_SEAL
```

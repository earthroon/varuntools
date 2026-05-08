# Commit 116 Migration Note

## Commit

```txt
feat(inquiry): add Cloudflare Worker inquiry API contract
```

## Baseline

Commit 115 hardened the existing Google Form inquiry intake contract. Commit 116 preserves that path and adds the Worker API contract beside it.

## Migration rule

```txt
Google Form intake remains available.
Worker API is added as an opt-in adapter.
Worker-first migration is deferred to Commit 120.
```

## Added

```txt
workers/inquiry-api
src/config/inquiryWorkerApi.ts
src/utils/inquiryWorkerSubmit.ts
scripts/smoke-inquiry-worker-api-contract.mjs
docs/authoring/inquiry-worker-api.md
BAKE_REPORT_COMMIT_116.md
```

## Not migrated yet

```txt
D1 storage
admin review queue
notification/reply workflow
Worker-first default submit path
Google Form deletion
```

## Operational note

`clientGuard` values are client-provided timing hints. They may be used to reject obvious submit-too-fast requests, but they are not the security SSOT. Durable rate limiting and persistent inquiry status belong to later commits.

## Verification

```txt
npm run smoke:inquiry-intake-contract
npm run smoke:inquiry-google-form
npm run smoke:inquiry-worker-api-contract
```

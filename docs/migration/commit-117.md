# Commit 117 Migration Note

## Commit

```txt
feat(inquiry): add D1 inquiry storage and status model
```

## Previous state

Commit 116 added the Cloudflare Worker `/api/inquiries` contract. It validated JSON requests and returned a guarded response, but it did not persist inquiry records.

## New state

Commit 117 adds D1-backed inquiry storage.

```txt
POST /api/inquiries
→ validate request
→ reject honeypot / submit-too-fast / invalid payload
→ create server receivedAt
→ insert inquiries row
→ insert inquiry_events rows
→ return persisted success response
```

## Added files

```txt
workers/inquiry-api/migrations/0001_inquiry_storage.sql
workers/inquiry-api/src/status.ts
workers/inquiry-api/src/id.ts
workers/inquiry-api/src/storage.ts
scripts/smoke-inquiry-d1-storage.mjs
docs/authoring/inquiry-d1-storage.md
docs/migration/commit-117.md
BAKE_REPORT_COMMIT_117.md
```

## Updated files

```txt
workers/inquiry-api/src/index.ts
workers/inquiry-api/src/types.ts
workers/inquiry-api/src/worker-runtime.d.ts
workers/inquiry-api/wrangler.toml
src/types/inquiry.ts
package.json
scripts/check-launch.mjs
scripts/smoke-inquiry-worker-api-contract.mjs
```

## D1 setup

Create a D1 database in Cloudflare and replace the placeholder in `workers/inquiry-api/wrangler.toml`.

```toml
[[d1_databases]]
binding = "INQUIRY_DB"
database_name = "varun-tools-inquiries"
database_id = "REPLACE_WITH_D1_DATABASE_ID"
```

Apply the migration with the project’s Worker deployment workflow.

## Production rule

Production must use:

```txt
INQUIRY_STORAGE_MODE=d1
```

Mock mode is only for local/dev contract checks.

## Deferred to later commits

```txt
Commit 118: admin inquiry review queue
Commit 119: notification and reply workflow
Commit 120: Worker-first migration from Google Form fallback
```

## Seal

Commit 117 is the D1 storage and status model commit. It does not add admin UI, notifications, public inquiry boards, or Google Form removal.

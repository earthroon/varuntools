# Commit 118 Migration

## Commit

`feat(admin): add inquiry review queue`

## Base

Commit 117 D1 inquiry storage remains the storage SSOT.

## Added

- Admin API inquiry list/detail routes
- status and priority update actions
- admin note event action
- event timeline read contract
- `/admin/inquiries` UI route
- queue table, filters, detail panel, badges, event timeline components
- `smoke:admin-inquiry-queue`

## Not added

- notification workflow
- reply automation
- public customer lookup
- Google Form removal
- Worker-first migration

## Required environment

Admin API Worker should bind the same D1 database used by the inquiry API:

```toml
[[d1_databases]]
binding = "INQUIRY_DB"
database_name = "varuntools-inquiries"
database_id = "REPLACE_WITH_INQUIRY_D1_DATABASE_ID"
```

Do not invent the production `database_id`; paste the value from Cloudflare D1.

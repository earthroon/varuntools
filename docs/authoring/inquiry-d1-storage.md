# Inquiry D1 Storage Contract

Commit 117 turns the Worker inquiry API from a validation boundary into a persisted intake boundary.

## Scope

Included:

- Cloudflare D1 binding contract
- `inquiries` table
- `inquiry_events` table
- status / priority model
- storage adapter contract
- persisted success response
- storage failure handling
- privacy and logging constraints

Excluded:

- admin inquiry queue UI
- admin status mutation API
- notification / reply workflow
- public inquiry board
- Google Form removal
- Worker-first migration

## Binding

```toml
[[d1_databases]]
binding = "INQUIRY_DB"
database_name = "varun-tools-inquiries"
database_id = "REPLACE_WITH_D1_DATABASE_ID"
```

`database_id` must be replaced with the real Cloudflare D1 database id before production deployment.

## Storage mode

```txt
INQUIRY_STORAGE_MODE = "d1" | "mock"
```

- `d1`: requires `INQUIRY_DB`; successful POST responses return `persisted: true`.
- `mock`: validates the request but does not persist it; successful POST responses return `persisted: false`.

Production should use `d1`. Mock mode is only for local contract checks and development.

## Tables

### inquiries

Stores the current inquiry record.

Core fields:

```txt
id
created_at
updated_at
received_at
status
priority
category
nickname
email
title
message
related_product_slug
source_path
source_url
client_fingerprint
user_agent
ip_hash
payload_json
```

### inquiry_events

Stores the inquiry history and later admin workflow events.

Core fields:

```txt
id
inquiry_id
created_at
event_type
note
actor
metadata_json
```

Commit 117 creates `received` and `stored` events during insert. Admin mutation events are reserved for Commit 118.

## Status model

```ts
type InquiryStatus =
  | 'new'
  | 'triaged'
  | 'in-progress'
  | 'waiting-reply'
  | 'closed'
  | 'spam'
```

New inquiries start as `new`.

## Priority model

```ts
type InquiryPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'
```

New inquiries start as `normal`.

## Response contract

D1 success:

```json
{
  "ok": true,
  "inquiryId": "...",
  "status": "received",
  "persisted": true,
  "storageMode": "d1",
  "inquiryStatus": "new",
  "priority": "normal",
  "message": "Inquiry request was received, validated, and persisted."
}
```

Mock success:

```json
{
  "ok": true,
  "inquiryId": "...",
  "status": "received",
  "persisted": false,
  "storageMode": "mock",
  "inquiryStatus": "new",
  "priority": "normal",
  "message": "Inquiry request was received and validated in mock storage mode. It was not persisted."
}
```

Storage failure:

```json
{
  "ok": false,
  "errorCode": "SERVER_ERROR",
  "message": "Inquiry storage failed."
}
```

## Privacy and logging rules

- Do not log raw inquiry messages.
- Do not log email addresses in ordinary runtime logs.
- Do not store raw IP addresses.
- Store `ip_hash` only when the request provides an address header.
- Keep `payload_json` internal to the intake system.
- Do not expose `payload_json` to public UI.

## Commit boundary

Commit 117 does not add the admin queue. It only gives Commit 118 a durable storage and status model to read from.

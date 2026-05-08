# Admin action audit log

Commit 86 turns the admin write dry-run audit plan into a real D1 ledger write.

## SSOT

`admin_action_audit_log` is the SSOT for admin write dry-run audit records.

A dry-run plan is only considered audit-ready when these fields are returned on the plan:

- `auditReady: true`
- `auditLogId`
- `auditRecordedAt`
- `requestId`

## Boundary

This is not a runtime mutation gateway. Grant revoke, grant reissue, refund note, support note, and webhook replay execution remain blocked. Commit 86 records the dry-run attempt and the redacted plan snapshot only.

## Stored fields

Allowed:

- masked actor email
- Access `sub`
- action kind
- plan status
- plan validity
- executionAllowed/runtimeBlocked booleans
- target ids needed for audit lookup
- confirm phrase matched boolean
- truncated reason/operator note
- request id and cf-ray
- redacted dry-run result JSON

Forbidden:

- raw Access JWT
- raw confirm phrase
- raw buyer email
- raw payment key
- raw R2 private key
- unbounded operator note

## Fail-closed rule

When `ADMIN_WRITE_AUDIT_LOG_REQUIRED !== 'false'`, an audit insert failure must return `ADMIN_AUDIT_LOG_WRITE_FAILED` and the dry-run response must not be returned as a success.

## Read API

`GET /api/audit-log` returns the latest admin action audit rows. Optional filters:

- `actionKind`
- `targetId`
- `requestId`
- `limit`
- `offset`

# Commit 86 — admin write dry-run audit ledger

## Commit

`feat(admin-api): record admin write dry-run audit ledger`

## Summary

Commit 86 records every admin write dry-run plan into the D1 `admin_action_audit_log` ledger before returning a successful dry-run response.

## Changes

- Added `workers/admin-api/src/auditLog.ts`.
- Added runtime audit fields through migration `0005_admin_action_audit_log_runtime_fields.sql`.
- Added `auditLogId`, `auditRecordedAt`, and `requestId` to `AdminWriteActionPlan`.
- Added `GET /api/audit-log`.
- Added `listAdminActionAuditLog()`.
- Added Admin UI `/audit-log` view.
- Added `smoke:admin-audit-log` and wired it into `check:security-smoke` and `check:launch`.

## Security boundary

Runtime write actions remain blocked. This commit only allows a sealed `INSERT INTO admin_action_audit_log` for dry-run audit records.

## SSOT

D1 `admin_action_audit_log` row.

## Verification

```bash
npm run smoke:admin-audit-log
npm run smoke:admin-write-guardrails
npm run smoke:admin-api-worker
npm run smoke:admin-access-signature
npm run admin-api:typecheck
npm run check:security-smoke
```

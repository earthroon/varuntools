# Commit 80 Migration — Admin Write Guardrails / Grant Revoke & Reissue Prep

## Added

- workers/admin-api/src/writeActionGuards.ts
- workers/admin-api/src/writeActionPlans.ts
- workers/admin-api/migrations/0004_admin_action_audit_log.sql
- admin/src/lib/adminWriteActions.ts
- admin/src/components/AdminWriteActionCard.vue
- admin/src/views/WriteGuardrailsView.vue
- docs/admin/admin-write-guardrails.md
- docs/admin/admin-action-audit-log.md
- docs/ops/grant-revoke-dry-run.md
- docs/ops/grant-reissue-dry-run.md
- docs/ops/refund-note-dry-run.md
- docs/ops/webhook-replay-guardrails.md
- scripts/smoke-admin-write-guardrails.mjs

## Modified

- workers/admin-api/src/index.ts
- workers/admin-api/src/types.ts
- workers/admin-api/src/env.ts
- workers/admin-api/src/http.ts
- admin/src/router.ts
- admin/src/App.vue
- admin views and ops docs
- package.json
- scripts/check-launch.mjs

## Runtime boundary

Commit 80 adds dry-run planning endpoints only. It does not execute revoke, reissue, refund, webhook replay, or D1 write operations.

## Non-goals

No purchase_grants mutation. No purchase_orders mutation. No webhook_events mutation. No refund API call. No email sending. No R2 mutation.

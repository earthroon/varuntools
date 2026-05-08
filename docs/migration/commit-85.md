# Commit 85 — split dry-run validity from execution allowance

## Commit

`refactor(admin): split dry-run validity from execution allowance`

## Summary

Commit 85 refactors the admin write dry-run plan contract so a valid plan cannot be mistaken for runtime execution permission.

## State ownership

- Server plan contract: `workers/admin-api/src/types.ts`
- Server plan calculation: `workers/admin-api/src/writeActionPlans.ts`
- Runtime write guard policy: `workers/admin-api/src/writeActionGuards.ts`
- Admin client mirror type: `admin/src/types/admin.ts`
- Admin UI wording: `admin/src/components/AdminWriteActionCard.vue`, `admin/src/views/WriteGuardrailsView.vue`
- Guardrail smoke: `scripts/smoke-admin-write-guardrails.mjs`

## New plan state fields

- `planGenerated`
- `planValid`
- `dryRunAllowed`
- `executionAllowed`
- `runtimeBlocked`
- `confirmationRequired`
- `confirmationSatisfied`
- `auditRequired`
- `auditReady`
- `status`
- `executionBlockedReason`

## Compatibility window

`ok` and `allowed` remain in the response shape, but they are compatibility mirrors:

- `ok === planValid`
- `allowed === executionAllowed`

Future execution code must check `executionAllowed`, never `ok` or `planValid`.

## Runtime policy

Commit 85 does not enable runtime mutations. In this commit:

- `executionAllowed` remains `false`.
- `runtimeBlocked` remains `true`.
- normal valid dry-run plans return `status: "runtime-blocked"`.

## Verification

Expected checks:

```bash
npm run smoke:admin-write-guardrails
npm run smoke:admin-api-worker
npm run smoke:admin-access-signature
npm run admin-api:typecheck
npm run check:security-smoke
npm run check:workers
```

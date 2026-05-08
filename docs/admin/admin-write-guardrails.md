# Admin Write Guardrails

Commit 80 defines the guardrails for future write actions. Runtime execution remains disabled.

## Action kinds

- grant-revoke
- grant-reissue
- refund-note
- support-note
- webhook-replay

## Modes

- disabled: safe default. No dry-run or runtime write is trusted as executable.
- dry-run: returns AdminWriteActionPlan only.
- enabled: reserved for a later commit after audit logging and confirmation UX are complete.

## Required gates

Cloudflare Access admits an operator to the admin app. The Admin API Worker verifies the Access JWT. Write guards then check role, ADMIN_WRITE_MODE, confirm phrase, risk level, and audit log readiness.

Access is not enough by itself. Access filters people; write guards filter hands.

## Confirm phrases

- REVOKE GRANT
- REISSUE GRANT
- REFUND NOTE
- SUPPORT NOTE
- REPLAY WEBHOOK

## Variant and bundle caution

Grant revoke and reissue must review variantId, bundleId, licenseScope, and entitlement scope before any future mutation. A reissue must not silently expand a purchased entitlement.

## Runtime policy

Commit 80 does not execute purchase_grants changes, purchase_orders changes, webhook_events changes, refunds, webhook replay, or email sending.

## Commit 85 state split

Commit 85 separates dry-run plan validity from runtime execution permission.

- `planValid`: the dry-run plan is internally coherent and its non-runtime blocker checks passed.
- `dryRunAllowed`: the current admin write mode allows plan generation.
- `executionAllowed`: the only field future mutation code may use to decide whether a write can run.
- `runtimeBlocked`: the dry-run-only runtime policy is still blocking mutation execution.
- `confirmationSatisfied`: the required phrase matched.
- `auditRequired`: an audit ledger is required before any future execution can be enabled.
- `auditReady`: false until a future audit-ledger commit wires durable execution logging.

Compatibility fields remain for one transition window:

- `ok` mirrors `planValid`.
- `allowed` mirrors `executionAllowed`.

Do not use `ok` or `planValid` to execute a write action. A plan can be valid while runtime execution remains blocked.

# Commit 74 Migration Note

## Scope

Commit 74 adds server-side payment activation for `POST /webhooks/toss`.

## Added

```txt
workers/delivery/src/paymentActivation.ts
workers/delivery/migrations/0002_payment_webhook_activation.sql
scripts/smoke-payment-grant-flow.mjs
docs/authoring/payment-webhook-activation.md
docs/migration/commit-74.md
BAKE_REPORT_COMMIT_74.md
```

## Updated

```txt
workers/delivery/src/index.ts
workers/delivery/src/db.ts
workers/delivery/src/env.ts
workers/delivery/src/toss.ts
workers/delivery/src/types.ts
package.json
workers/delivery/package.json
scripts/check-launch.mjs
scripts/smoke-payment-webhook.mjs
docs/authoring/checkout-handoff.md
docs/authoring/purchase-grants.md
docs/authoring/buyer-claim-flow.md
docs/authoring/launch-checklist.md
```

## D1 migration

Apply `workers/delivery/migrations/0002_payment_webhook_activation.sql` to add webhook processing result columns and an order/product unique index for grants.

## Smoke

```bash
npm run smoke:payment-grant-flow
npm run smoke:payment-webhook
```

## Non-goals

- No frontend payment confirmation.
- No email sending.
- No refund/revoke policy.
- No variant/bundle grant model.
- No manifest-page sync automation.

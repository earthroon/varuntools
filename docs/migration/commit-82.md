# Commit 82 — Authenticated Payment Webhook Ingress

Commit: `fix(delivery): require authenticated payment webhooks`

## SSOT

- Webhook ingress auth: `workers/delivery/src/paymentWebhookAuth.ts`
- Payment activation: `workers/delivery/src/paymentActivation.ts`
- Event idempotency ledger: D1 `webhook_events`
- Final payment authority: server-to-server Toss retrieve

## Runtime contract

`PAYMENT_WEBHOOK_MODE=test|live|configured` requires `PAYMENT_WEBHOOK_SECRET` with at least 32 characters. Requests must use either `/webhooks/toss/<secret>` or `x-varuntools-webhook-secret`.

Authentication failures are rejected before DB writes and before Toss retrieve.

## Verification

```bash
npm run smoke:payment-webhook
npm run smoke:payment-grant-flow
npm run smoke:delivery-worker
npm --prefix workers/delivery run check
```

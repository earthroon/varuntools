# Payment Webhook Contract

`POST /webhooks/toss/<PAYMENT_WEBHOOK_SECRET>` is the trigger endpoint for Toss payment status events.

## Commit 82 Webhook ingress secret

Payment status webhooks are public internet ingress. The Worker must reject unauthenticated webhook requests before it writes `webhook_events`, retrieves Toss payments, or creates purchase grants.

Accepted ingress forms:

```txt
POST /webhooks/toss/<PAYMENT_WEBHOOK_SECRET>
POST /webhooks/toss
x-varuntools-webhook-secret: <PAYMENT_WEBHOOK_SECRET>
```

The path secret is the preferred form because it can be registered directly as the Toss webhook URL. Query-string secrets are intentionally not supported because they are easy to leak into logs and analytics.

The ingress secret is not final payment proof. It only proves that the request reached the registered VarunTools webhook entrance. Final payment authority remains the server-to-server Toss retrieve result.

## Contract

1. Require `PAYMENT_WEBHOOK_MODE` to be configured.
2. Require `PAYMENT_WEBHOOK_SECRET` to be at least 32 characters.
3. Verify the path/header secret with a SHA-256 constant-time comparison.
4. Reject missing or invalid secrets before reading or writing payment ledgers.
5. Enforce `PAYMENT_WEBHOOK_MAX_BODY_BYTES` before JSON parsing.
6. Parse JSON and build a stable `eventId`.
7. Deduplicate with an atomic `webhook_events.event_id` insert.
8. Retrieve the payment server-to-server with `paymentKey`.
9. Create or update `purchase_orders`.
10. Create an active `purchase_grant` only for paid payments.

Commit 82 does not include live Toss keys. `TOSS_RETRIEVE_MODE` remains `not_configured` until deployment secrets are set.

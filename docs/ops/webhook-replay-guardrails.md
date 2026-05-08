# Webhook Replay Guardrails

Webhook replay is high risk because it can duplicate grant activation if idempotency is bypassed.

## Dry-run checks

- eventId exists
- resultCode reviewed
- paymentKeyMasked reviewed
- existing purchase_order checked
- existing grant checked
- already-granted state blocks replay
- confirm phrase `REPLAY WEBHOOK`

## Commit 80 status

Runtime replay is unsupported. Replay remains dry-run only.

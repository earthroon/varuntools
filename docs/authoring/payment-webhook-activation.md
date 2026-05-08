# Payment Webhook Activation

Commit 74 closes the server-side bridge from a verified payment event to a purchase grant.

## Trust boundary

결제 성공 화면은 구매 권한을 증명하지 않습니다. `successUrl` is only a landing page. A buyer may see the success page before the server has verified the payment, and the frontend must not create or expose download rights.

The Worker must also avoid trusting the webhook payload as final proof. It receives `POST /webhooks/toss`, extracts `paymentKey`, then retrieves the payment server-to-server before creating any grant.


## Commit 82 ingress authentication

`POST /webhooks/toss` is no longer enough to enter the activation flow. The registered webhook URL should be:

```txt
POST /webhooks/toss/<PAYMENT_WEBHOOK_SECRET>
```

The Worker verifies the ingress secret before it records `webhook_events` or calls Toss retrieve. Missing, weak, or invalid secrets fail closed. Oversized raw bodies are rejected before JSON parsing.

The ingress secret is only the entrance guard. The Worker still treats Toss retrieve as the final payment authority before creating a purchase grant.

## Activation flow

```txt
POST /webhooks/toss
  -> record webhook_events as received
  -> dedupe by stable eventId
  -> retrieveTossPaymentSafe(paymentKey)
  -> require payment.status === 'DONE'
  -> resolve metadata.productSlug
  -> require product.launch.readyForCheckout
  -> require private deliverables
  -> validate expectedAmount when present
  -> upsert purchase_orders
  -> createPurchaseGrantOnce(orderId + productSlug)
  -> update webhook_events result
```

## D1 ledgers

- `webhook_events` is the payment event SSOT.
- `purchase_orders` is the verified order ledger.
- `purchase_grants` is the buyer delivery permission SSOT.

`paymentKey` and `eventId` idempotency must prevent duplicate grant creation when Toss retries a webhook. Failed or unpaid payment events are recorded, but they must not create grants.

## Runtime modes

```txt
PAYMENT_WEBHOOK_MODE=not_configured | test | live
TOSS_RETRIEVE_MODE=not_configured | test | live
```

`not_configured` is fail-closed. `test` and `live` are separate so deployment secrets do not silently cross modes.

## Result states

```txt
grant-created
already-processed
already-granted
no-grant
failed
```

`no-grant` is used for a valid event that does not produce a grant, such as `payment-not-paid`. `failed` is used for processing errors such as missing `paymentKey`, retrieve failure, product mismatch, or amount mismatch.

## Amount validation

Commit 74 validates `payment.metadata.expectedAmount` when present. If absent, amount validation is skipped and production launch should later promote that gap to a blocker.

## Commit 76 admin surface note

Webhook activation data belongs to the server-side ledger. The admin app may display redacted webhook read models after Commit 77, but the public storefront must never read `webhook_events` or trust checkout success pages as payment authority.

## Commit 78 ops handoff

Commit 78 reads purchase_orders, purchase_grants, and webhook_events through Admin API and maps them to opsStatus values. It does not replay webhooks or mutate payment state.

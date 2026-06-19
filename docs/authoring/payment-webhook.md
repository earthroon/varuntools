# Payment webhook authoring contract

The delivery worker exposes `/webhooks/toss/<PAYMENT_WEBHOOK_SECRET>` as the authenticated Toss webhook ingress path.

## Webhook ingress secret

The route accepts the path secret or the `x-varuntools-webhook-secret` header and compares it with timing-safe equality. Weak or missing secrets are rejected before the body is trusted.

## Toss retrieve

After receiving a new webhook event, the worker retrieves the Toss payment server-to-server through the Toss retrieve boundary before creating purchase grants.

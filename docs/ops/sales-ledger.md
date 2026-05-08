# Sales Ledger

The sales ledger maps purchase_orders, webhook_events, and matching grant state into an operator-readable view. Columns: orderId, productSlug, productTitle, paymentProvider, paymentStatus, opsStatus, amount, currency, paymentKeyMasked, buyerEmailMasked, grantStatus, grantIdMasked, webhookResultCode, createdAt, updatedAt, supportFlag. DONE payment maps to paid. DONE payment with matching grant maps to grant-created. webhook_events.status failed maps to webhook-failed. DONE payment without grant after activation maps to support-needed. Exports are masked only.


## Commit 79 variant / bundle note

Variant and bundle fields (`variantId`, `bundleId`, `licenseScope`, and computed `deliverableCount`) are read-only entitlement metadata. Public pages must never expose `deliverableSetId`, `deliverableIds`, `r2Key`, `privatePath`, or `entitlement_scope_json`.
